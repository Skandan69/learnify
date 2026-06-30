import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { sourceContent, topic, userAnswer } = body;
  if (!sourceContent || !userAnswer) {
    return NextResponse.json({ error: 'sourceContent and userAnswer are required.' }, { status: 400 });
  }

  const gradingPrompt = `You are an expert study coach grading a student's free-write answer.

ORIGINAL STUDY CONTENT:
${sourceContent}

TOPIC/QUESTION GIVEN TO STUDENT:
${topic}

STUDENT'S ANSWER:
${userAnswer}

Grade the student's answer against the original study content. Be specific and constructive.

Use EXACTLY this format:
[[SCORE]]
<A number from 0 to 100 representing coverage and accuracy>
[[GRADE_LABEL]]
<One of: Excellent / Good / Needs Work / Try Again>
[[COVERED]]
<Bullet list of key facts/concepts the student covered correctly — one per line>
[[MISSED]]
<Bullet list of important facts/concepts that were missing or wrong — one per line>
[[FEEDBACK]]
<2-3 sentences of specific, constructive feedback on how to improve>`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are a precise study coach. Follow the [[MARKER]] format exactly.',
        messages: [{ role: 'user', content: gradingPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || `Anthropic API error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = (data.content || []).map((i) => i.text || '').join('').trim();
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
