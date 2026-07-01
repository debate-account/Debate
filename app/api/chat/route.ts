import Anthropic from '@anthropic-ai/sdk';
import { systemPrompt } from '@/lib/prompt';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // needs fs for the prompt

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

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
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
