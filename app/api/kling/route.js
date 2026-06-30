import { NextResponse } from 'next/server';

const KLING_API = 'https://api.klingapi.com';
const KLING_KEY = process.env.KLING_API_KEY;

export async function POST(req) {
  if (!KLING_KEY) return NextResponse.json({ error: 'KLING_API_KEY not set' }, { status: 500 });
  const { prompt, duration = 5, aspect_ratio = '16:9' } = await req.json();
  try {
    const res = await fetch(KLING_API + '/v1/videos/text2video', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + KLING_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'kling-v2.5-turbo', prompt, duration, aspect_ratio }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Kling error' }, { status: res.status });
    return NextResponse.json({ task_id: data.task_id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  if (!KLING_KEY) return NextResponse.json({ error: 'KLING_API_KEY not set' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const task_id = searchParams.get('task_id');
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  try {
    const res = await fetch(KLING_API + '/v1/videos/' + task_id, {
      headers: { 'Authorization': 'Bearer ' + KLING_KEY },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Poll error' }, { status: res.status });
    return NextResponse.json({
      status: data.status,
      video_url: data.video_url || data.works?.[0]?.resource?.resource || null,
      progress: data.progress || 0,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
