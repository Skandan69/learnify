import { NextResponse } from 'next/server';

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const enriched = 'Cinematic documentary still. Dramatic lighting, historically accurate, epic. ' + prompt + ' National Geographic style. No text.';

  // Try gpt-image-1 first, fall back to dall-e-2
  const models = [
    { model: 'gpt-image-1', size: '1536x1024', response_format: 'b64_json' },
    { model: 'dall-e-2', size: '1024x1024', response_format: 'url' },
  ];

  for (const cfg of models) {
    try {
      const body = { model: cfg.model, prompt: enriched, n: 1, size: cfg.size };
      if (cfg.response_format) body.response_format = cfg.response_format;
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error?.message || '';
        if (msg.includes('does not exist') || msg.includes('not found') || res.status === 404) continue;
        return NextResponse.json({ error: msg }, { status: res.status });
      }
      const item = data.data[0];
      if (item.url) return NextResponse.json({ url: item.url });
      if (item.b64_json) {
        const url = 'data:image/png;base64,' + item.b64_json;
        return NextResponse.json({ url });
      }
    } catch (e) { continue; }
  }

  return NextResponse.json({ error: 'No available image model' }, { status: 500 });
}
