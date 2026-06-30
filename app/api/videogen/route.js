import { NextResponse } from 'next/server';

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE = 'https://api.replicate.com/v1';

export async function POST(req) {
  if (!REPLICATE_TOKEN) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 });
  const { prompt } = await req.json();
  try {
    const res = await fetch(BASE + '/models/bytedance/seedance-1-pro-fast/predictions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + REPLICATE_TOKEN, 'Content-Type': 'application/json', 'Prefer': 'wait' },
      body: JSON.stringify({ input: { prompt, duration: 5, aspect_ratio: '16:9', resolution: '720p' } }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.detail || 'Replicate error' }, { status: res.status });
    return NextResponse.json({ id: data.id, status: data.status, output: data.output });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  if (!REPLICATE_TOKEN) return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    const res = await fetch(BASE + '/predictions/' + id, {
      headers: { 'Authorization': 'Bearer ' + REPLICATE_TOKEN },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.detail || 'Poll error' }, { status: res.status });
    return NextResponse.json({
      status: data.status,
      video_url: Array.isArray(data.output) ? data.output[0] : data.output || null,
      error: data.error || null,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
