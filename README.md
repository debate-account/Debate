# Debate Practice — web app starter

Next.js (App Router) + Supabase (auth + database) + Claude API. Your debate
instructions are the system prompt; case docs / sample rounds in `/knowledge`
are appended, mirroring the Claude Project's "project knowledge."

## What's built
- **Login** (Supabase email/password) — multi-user from day one.
- **Practice chat** with streaming replies from Claude.
- **Practice modes** as buttons (Opponent / Judge / Coach / Impromptu) — they send the keyword your instructions already understand.
- **Save round** → stored per-user in Postgres.
- **Voice**: button stubbed, not wired. I/O is kept separate from round logic so it drops in later without a rewrite.

## Setup (~15 min)
1. **Supabase**: create a project at app.supabase.com. In the SQL editor, run `supabase/schema.sql`. (Optional: disable "Confirm email" under Auth settings for faster testing.)
2. **Anthropic**: get an API key at console.anthropic.com (pay-per-token, separate from a Claude.ai plan).
3. **Env**: `cp .env.local.example .env.local` and fill in the three values.
4. **Run**: `npm install` then `npm run dev` → open http://localhost:3000

## Deploy
Push to GitHub, import into Vercel, add the same three env vars. Done.

## Editing the debate behavior
- Change how the opponent/judge/coach behave → edit `debate-instructions.md` (this is the whole "brain").
- Add motions/cases the opponent can draw on → drop `.md`/`.txt` files into `/knowledge`. (Large libraries: prefer a retrieval layer later instead of appending everything — every file here is sent on every request.)
- Model is `claude-sonnet-4-6` in `app/api/chat/route.ts`.

## Next steps (deferred by design)
- **Voice** input/output mode — add speech-to-text + text-to-speech around the existing text layer.
- **Progress tracking** — the `rounds` table already stores each round; parse the judge's scores into the `scores` column and chart them over time.
- **Modes/styles** — extend the mode buttons; each can carry its own framing.
