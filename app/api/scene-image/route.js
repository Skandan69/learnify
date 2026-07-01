import { NextResponse } from 'next/server';
export const maxDuration = 60;
// v4 - dall-e-2, no response_format param
export async function POST(req) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'no key' }, { status: 500 });
  const { prompt } = await req.json();
  const full = 'Cinematic historical documentary still. Dramatic lighting. ' + (prompt || '') + ' National Geographic style. No text.';
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-2', prompt: full.slice(0, 1000), n: 1, size: '512x512' }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message || 'OpenAI error' }, { status: res.status });
    return NextResponse.json({ url: data.data[0].url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}