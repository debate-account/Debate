// Turn a logged-in user's saved custom rows (from Supabase) into the shapes the
// picker, Chat, and the system prompt already understand. A custom FORMAT reuses
// the "other / custom" round path; a custom DRILL reuses drill mode with a brief
// we assemble from the user's plain-language "what to practice" instructions.

export type CustomFormatRow = {
  id: string;
  name: string;
  description?: string | null;
  speeches?: string | null; // one speech line per row, newline-separated
  criteria?: string | null; // one judging criterion per line
};

export type CustomDrillRow = {
  id: string;
  name: string;
  tag?: string | null;
  blurb?: string | null;
  instructions?: string | null; // plain-language "what should this drill practice?"
};

// Max saved customs per user, per type. Storage is negligible; this is just a
// runaway guard — bump it freely.
export const MAX_CUSTOM = 20;

export function splitLines(text?: string | null): string[] {
  return (text || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

// The drill-mode system-prompt brief, built from the user's instructions.
export function customDrillBrief(d: CustomDrillRow): string {
  const what = (d.instructions || '').trim() || 'Practice the skill described by the drill name.';
  return (
    `This is a CUSTOM SKILL DRILL: "${d.name}" — not a full debate round. Act as a focused coach.\n` +
    `What this drill should make the debater practice:\n${what}\n\n` +
    'Run it as a drill: set up a short, concrete scenario, ask the debater for their response, then coach — ' +
    'name what worked, give ONE concrete fix, score it out of 10, and offer another rep with a fresh scenario. ' +
    'Keep it tight. Do NOT run a full round or play a full opposing bench unless this drill explicitly calls for it.'
  );
}

export function customDrillKickoff(d: CustomDrillRow): string {
  return `Start the "${d.name}" drill. Set it up with a scenario, then wait for my response.`;
}
