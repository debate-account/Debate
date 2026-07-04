import Anthropic from '@anthropic-ai/sdk';
import { systemPrompt, formatBrief, guestTrialDirective, avoidMotionsDirective } from '@/lib/prompt';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // needs fs for the prompt

// Trial cap for logged-OUT users, keyed by IP. Roughly one round's worth of
// messages per IP per day; logged-in users are exempt (we can see who they are).
// NOTE: this is an in-memory counter — it resets on cold start and isn't shared
// across serverless instances, so it's a casual deterrent, not hard enforcement.
// For hard limits, back it with a durable store (a Supabase table or Vercel KV).
const TRIAL_MSG_CAP = 15;
const TRIAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const trialHits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return xff?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
  // Guests can run an unsaved trial round, but are capped per IP. Logged-in
  // users bypass the cap entirely.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const ip = clientIp(req);
    const now = Date.now();
    const rec = trialHits.get(ip);
    if (!rec || now > rec.resetAt) {
      trialHits.set(ip, { count: 1, resetAt: now + TRIAL_WINDOW_MS });
    } else if (rec.count >= TRIAL_MSG_CAP) {
      return new Response('Trial limit reached — sign up or log in to keep practicing.', { status: 429 });
    } else {
      rec.count += 1;
    }
  }

  // Surface a missing/empty API key explicitly. Constructing the client at
  // module scope with an undefined key throws opaquely at cold-start, and an
  // empty string sails past the SDK's null-check only to 401 mid-stream after
  // a 200 has already been sent. Check here, before anything commits.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is missing or empty');
    return new Response('Server misconfigured: ANTHROPIC_API_KEY is not set', { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { messages, format, avoidMotions } = await req.json();

  // Guest status is decided server-side (from the auth cookie), so a client can't
  // spoof it to escape the trial's structure lock.
  const isGuest = !user;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: systemPrompt() + formatBrief(format) + avoidMotionsDirective(avoidMotions) + (isGuest ? guestTrialDirective() : ''),
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
