import { NextResponse } from 'next/server';

export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const enriched = 'Cinematic documentary still image. High detail, dramatic lighting, historically accurate. ' + prompt + ' Style: epic historical painting, National Geographic photography aesthetic. No text or watermarks.';

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-3', prompt: enriched, n: 1, size: '1792x1024', quality: 'standard' }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message || 'OpenAI error' }, { status: res.status });
    return NextResponse.json({ url: data.data[0].url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
