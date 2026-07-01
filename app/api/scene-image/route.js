import { NextResponse } from 'next/server';
export const maxDuration = 60;
// v5 - gpt-image-1 correct usage: no response_format, returns b64_json as data URL
export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  const { prompt } = await req.json();
  const full = 'Cinematic historical documentary still. Dramatic lighting, epic atmosphere. ' + (prompt || '') + ' National Geographic style photography. No text or watermarks.';
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: full.slice(0, 1000), n: 1, size: '1024x1024', quality: 'low' }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message || 'OpenAI error' }, { status: res.status });
    const b64 = data.data[0].b64_json;
    if (!b64) return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    return NextResponse.json({ url: 'data:image/png;base64,' + b64 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}