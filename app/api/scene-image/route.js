import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt' }, { status: 400 });

    const cinematic = `Cinematic documentary scene, dramatic lighting, ultra-realistic photography, 16:9 composition: ${prompt}`;

    const fd = new FormData();
    fd.append('prompt', cinematic);
    fd.append('output_format', 'jpeg');
    fd.append('aspect_ratio', '16:9');

    const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: 'image/*',
      },
      body: fd,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return NextResponse.json({ image: base64 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
