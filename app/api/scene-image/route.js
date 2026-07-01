import { NextResponse } from 'next/server';
export const maxDuration = 60;
// v7 - flux-schnell (fastest), with polling fallback
export async function POST(req) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 });
  const { prompt } = await req.json();
  const full = 'Cinematic historical documentary photograph, dramatic golden lighting. ' + (prompt || '') + ' Photorealistic, ancient setting, epic atmosphere, detailed. No text.';
  try {
    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'wait=50'
      },
      body: JSON.stringify({
        input: {
          prompt: full.slice(0, 800),
          num_outputs: 1,
          aspect_ratio: '16:9',
          output_format: 'webp',
          output_quality: 80,
          go_fast: true
        }
      })
    });
    const data = await res.json();
    if (data.status === 'succeeded' && data.output?.[0]) {
      return NextResponse.json({ url: data.output[0] });
    }
    if (data.error) return NextResponse.json({ error: data.error }, { status: 500 });
    if (data.id) {
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch('https://api.replicate.com/v1/predictions/' + data.id, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const pd = await poll.json();
        if (pd.status === 'succeeded' && pd.output?.[0]) {
          return NextResponse.json({ url: pd.output[0] });
        }
        if (pd.status === 'failed') {
          return NextResponse.json({ error: pd.error || 'Generation failed' }, { status: 500 });
        }
      }
    }
    return NextResponse.json({ error: 'Timed out' }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}