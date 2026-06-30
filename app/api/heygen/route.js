import { NextResponse } from 'next/server';

const HEYGEN_KEY = process.env.HEYGEN_API_KEY;
const BASE = 'https://api.heygen.com';

export async function POST(req) {
  try {
    const { scenes, avatarId = 'Anna_public_3_20240108', title = '' } = await req.json();
    if (!HEYGEN_KEY) return NextResponse.json({ error: 'HEYGEN_API_KEY not set' }, { status: 500 });

    const video_inputs = scenes.slice(0, 10).map((scene) => ({
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
      voice: {
        type: 'text',
        input_text: scene.narration || scene.text || 'No narration.',
        voice_id: '1bd001e7e50f421d891986aad5158bc8',
        speed: 1.0,
      },
      background: { type: 'color', value: '#0f172a' },
    }));

    const res = await fetch(`${BASE}/v2/video/generate`, {
      method: 'POST',
      headers: { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_inputs, dimension: { width: 1280, height: 720 }, caption: false, title: title || 'Learnify Video' }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return NextResponse.json({ error: data.message || 'HeyGen error' }, { status: 400 });
    return NextResponse.json({ video_id: data.data?.video_id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const video_id = searchParams.get('video_id');
    if (!video_id) return NextResponse.json({ error: 'Missing video_id' }, { status: 400 });
    const res = await fetch(`${BASE}/v1/video_status.get?video_id=${video_id}`, {
      headers: { 'X-Api-Key': HEYGEN_KEY },
    });
    const data = await res.json();
    return NextResponse.json(data.data || data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
