import Anthropic from '@anthropic-ai/sdk';
import { systemPrompt } from '@/lib/prompt';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // needs fs for the prompt

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Surface a missing/empty API key explicitly. Constructing the client at
  // module scope with an undefined key throws opaquely at cold-start, and an
  // empty string sails past the SDK's null-check only to 401 mid-stream after
  // a 200 has already been sent. Check here, before anything commits.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is missing or empty');
    return new Response('Server misconfigured: ANTHROPIC_API_KEY is not set', { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { messages } = await req.json();

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: systemPrompt(),
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        // A request-time failure (bad key, rate limit, model error) lands here.
        // Log it and error the stream so the client's read rejects instead of
        // silently receiving an empty 200 body.
        console.error('Anthropic stream error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
