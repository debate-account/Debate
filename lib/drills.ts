// Focused skill drills — no opponent, just a scenario, your response, and coaching.
// The rebuttal drill is built on the 4-step refutation (They say / but / because /
// therefore) and the DR. MO angles (Deny, Reverse, Minimize, Outweigh). Swap in a
// different checklist by editing REBUTTAL_WAYS below.

export type Drill = {
  id: string;
  name: string;
  tag: string;
  blurb: string;    // card + pre-drill intro
  brief: string;    // appended to the system prompt in drill mode
  kickoff: string;  // first message that starts the drill
};

const WEIGHING_MECHANISMS =
  'magnitude (how much is at stake), probability (how likely), timeframe (how soon), ' +
  'reversibility (can it be undone), scope (how many are affected), and proximity/vulnerability (who is affected).';

const REBUTTAL_WAYS =
  'DENY (contradiction, false premise, or unsupported claim — no evidence needed); ' +
  "REVERSE / TURN (the point actually helps our side); " +
  'MINIMIZE (less likely, smaller, or slower than claimed — attack the link/warrant); ' +
  'OUTWEIGH (grant it, but our impact matters more under the framework); ' +
  'plus non-uniqueness (it happens anyway) and alternative cause.';

export const DRILLS: Drill[] = [
  {
    id: 'weighing',
    name: 'Weighing',
    tag: 'Compare impacts',
    blurb: 'Get a motion and two competing impacts, then weigh them. The coach scores how decisively you weigh.',
    brief:
      'This is a WEIGHING DRILL — not a full debate round. Act as a focused coach.\n' +
      '1. Present ONE motion and TWO competing arguments or impacts (they can favour opposite sides). Keep each to a sentence or two.\n' +
      '2. Ask the debater to weigh them — which matters more and why.\n' +
      `3. When they respond, evaluate their weighing against these mechanisms: ${WEIGHING_MECHANISMS} ` +
      'Name which mechanisms they used well, which they missed, and give ONE concrete way to weigh more decisively (e.g. comparative language, a clear metric).\n' +
      '4. Score the weighing out of 10, then offer another rep with a fresh scenario.\n' +
      'Keep it tight and practical. Do NOT deliver full speeches or play an opponent.',
    kickoff: 'Start a weighing drill. Give me a motion and two competing arguments to weigh, then wait for my weighing.',
  },
  {
    id: 'rebuttal',
    name: 'Rebuttal',
    tag: 'Refute a contention',
    blurb: 'Get a motion and one contention, then refute it. The coach scores your structure and angle of attack.',
    brief:
      'This is a REBUTTAL DRILL — not a full debate round. Act as a focused coach.\n' +
      '1. Present ONE motion and ONE contention to refute — a claim, its warrant, and an impact — in a few sentences.\n' +
      '2. Ask the debater to refute it.\n' +
      '3. When they respond, evaluate the refutation on TWO axes:\n' +
      '   - Structure (4-step): They say… / But… / Because (reasoning + example)… / Therefore (impact comparison). Note any step that is missing or thin.\n' +
      `   - Angle of attack: ${REBUTTAL_WAYS} Say which angle(s) they used and the single strongest line of attack they missed.\n` +
      '4. Give ONE concrete improvement, score the refutation out of 10, and offer another rep.\n' +
      'Keep it tight. Do NOT run a full round or deliver the opposing constructive.',
    kickoff: 'Start a rebuttal drill. Give me a motion and one contention to refute, then wait for my refutation.',
  },
];

export function findDrill(id?: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}
