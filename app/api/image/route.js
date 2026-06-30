import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'STABILITY_API_KEY not configured on server. Add it to .env.local to enable Image Story.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { prompt } = body;
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required.' }, { status: 400 });
  }

  try {
    // Use SD3 via the v2beta stable-image endpoint for much better quality
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('negative_prompt', 'blurry, low quality, watermark, signature, text overlay, distorted faces, bad anatomy');
    formData.append('aspect_ratio', '16:9');
    formData.append('output_format', 'png');
    formData.append('model', 'sd3-large');

    const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*',
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      // Fall back to SDXL if SD3 fails (e.g. insufficient credits)
      return await fallbackToSDXL(apiKey, prompt);
    }

    const imageBuffer = await res.arrayBuffer();
    const b64 = Buffer.from(imageBuffer).toString('base64');
    return NextResponse.json({ image: `data:image/png;base64,${b64}` });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}

async function fallbackToSDXL(apiKey, prompt) {
  try {
    const res = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: 'blurry, low quality, text, watermark, signature', weight: -1 },
          ],
          cfg_scale: 7,
          height: 768,
          width: 1344,
          steps: 40,
          samples: 1,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.message || `Stability AI error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const b64 = data?.artifacts?.[0]?.base64;
    if (!b64) {
      return NextResponse.json({ error: 'No image returned from Stability AI.' }, { status: 500 });
    }
    return NextResponse.json({ image: `data:image/png;base64,${b64}` });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
