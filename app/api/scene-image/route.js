import { NextResponse } from 'next/server';

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const enriched = 'Cinematic documentary still. Dramatic lighting, historically accurate, epic. ' + prompt + ' National Geographic style. No text.';

  // Try gpt-image-1 (returns b64_json, no response_format param)
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: enriched, n: 1, size: '1536x1024' }),
    });
    const data = await res.json();
    if (res.ok && data.data?.[0]?.b64_json) {
      return NextResponse.json({ url: 'data:image/png;base64,' + data.data[0].b64_json });
    }
    // If gpt-image-1 fails, fall through to dall-e-2
  } catch (e) {}

  // Fallback: dall-e-2
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-2', prompt: enriched.slice(0, 1000), n: 1, size: '1024x1024', response_format: 'url' }),
    });
    const data = await res.json();
    if (res.ok && data.data?.[0]?.url) {
      return NextResponse.json({ url: data.data[0].url });
    }
    return NextResponse.json({ error: data.error?.message || 'Image generation failed' }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
