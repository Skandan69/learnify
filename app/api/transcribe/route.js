import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { frames } = await req.json();
    if (!frames || frames.length === 0) {
      return Response.json({ error: 'No frames provided' }, { status: 400 });
    }

    // Build content array — up to 10 frames to stay within token limits
    const selected = frames.slice(0, 10);
    const content = [
      ...selected.map((f, i) => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: f },
      })),
      {
        type: 'text',
        text: `These are ${selected.length} frames extracted at regular intervals from a video (lecture, tutorial, or recorded lesson).

Your task: Extract and reconstruct ALL the content visible across these frames into coherent study notes.

- Read every slide title, bullet point, diagram label, whiteboard text, and subtitle
- Combine content from all frames in order, removing duplicates
- Preserve headings and structure
- If frames show a presenter speaking without slide text, describe the visible topic context
- Output clean study notes only — no commentary about the frames themselves`,
      },
    ];

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    return Response.json({ text: message.content[0].text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
