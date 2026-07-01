import { NextResponse } from 'next/server';
export const maxDuration = 60;
// v6 - Replicate SDXL-Lightning (2-5s per image, fast)
export async function POST(req) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 });
  const { prompt } = await req.json();
  const full = 'Cinematic historical documentary photograph, dramatic golden lighting, ancient setting. ' + (prompt || '') + ' Epic atmosphere, detailed, photorealistic. No text.';
  try {
    const res = await fetch('https://api.replicate.com/v1/models/bytedance/sdxl-lightning-4step/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: full.slice(0, 800),
          width: 1024,
          height: 576,
          num_inference_steps: 4,
          guidance_scale: 0,
          negative_prompt: 'text, watermark, logo, blurry, modern, cartoon, anime'
        }
      })
    });
    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error }, { status: 500 });
    const url = Array.isArray(data.output) ? data.output[0] : data.output;
    if (!url) return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}