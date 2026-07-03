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
  'Prerequisite (your argument must happen or be solved first before theirs can even exist or be solved); ' +
  'Magnitude (the sheer size, scale, or number of people affected by the impact); ' +
  'Probability (the statistical likelihood the impact will actually happen); ' +
  'Timeframe (how fast the impact occurs — immediate harms outweigh distant ones); ' +
  'Reversibility (whether the damage is permanent or can be fixed and undone later); ' +
  'Scope (the depth, severity, or systemic intensity of the harm on a specific group).';

// The BUTTON refutation checklist.
const REBUTTAL_WAYS =
  'No Brink (B — the opponent\'s link or internal cause is too weak to create their claimed impact); ' +
  'Non-Unique (U — the feared impact will happen regardless of whether their side wins); ' +
  'Link Turn (T — their cause and effect are backwards; their action leads to the exact opposite of what they want); ' +
  'Impact Turn (T — concede the action occurs, but argue the outcome is actually bad, or vice-versa); ' +
  'Outweighs (O — concede it might be true, but your side\'s impacts matter more, e.g. bigger scale or faster timeline); ' +
  'No Link (N — there is no logical connection between their action and their claimed impact; the cause does not produce the effect).';

export const DRILLS: Drill[] = [
  {
    id: 'weighing',
    name: 'Weighing',
    tag: 'Compare impacts',
    blurb: 'Get assigned a side, a motion, and two competing impacts — then argue why yours matters more.',
    brief:
      'This is a WEIGHING DRILL — not a full debate round. Act as a focused coach.\n' +
      '1. Choose a motion and ASSIGN the debater a side (Proposition or Opposition). Give TWO competing impacts: ONE that supports the debater\'s assigned side and ONE from the opposing side. State clearly which impact is theirs and which is the opponent\'s. Keep each to a sentence or two.\n' +
      '2. Ask the debater to weigh — to argue that THEIR side\'s impact matters more than the opponent\'s — using weighing mechanisms.\n' +
      `3. When they respond, evaluate their weighing against these mechanisms: ${WEIGHING_MECHANISMS} ` +
      'Name which mechanisms they used well, which they missed, and give ONE concrete way to weigh more decisively (e.g. comparative language, a clear metric).\n' +
      '4. Score the weighing out of 10, then offer another rep with a fresh scenario (vary the assigned side).\n' +
      'Keep it tight and practical. Do NOT deliver full speeches or play an opponent.',
    kickoff: 'Start a weighing drill. Assign me a side, give me a motion with my impact and the opposing impact, then wait for my weighing.',
  },
  {
    id: 'rebuttal',
    name: 'Rebuttal',
    tag: 'Refute a contention',
    blurb: 'Get a motion and one contention, then refute it. The coach scores your structure and your BUTTON angle of attack.',
    brief:
      'This is a REBUTTAL DRILL — not a full debate round. Act as a focused coach.\n' +
      '1. Present ONE motion and ONE contention to refute — a claim, its warrant, and an impact — in a few sentences.\n' +
      '2. Ask the debater to refute it.\n' +
      '3. When they respond, evaluate the refutation on TWO axes:\n' +
      '   - Structure (4-step): They say… / But… / Because (reasoning + example)… / Therefore (impact comparison). Note any step that is missing or thin.\n' +
      `   - Angle of attack — the BUTTON checklist: ${REBUTTAL_WAYS} Say which BUTTON angle(s) they used and the single strongest one they missed.\n` +
      '4. Give ONE concrete improvement, score the refutation out of 10, and offer another rep.\n' +
      'Keep it tight. Do NOT run a full round or deliver the opposing constructive.',
    kickoff: 'Start a rebuttal drill. Give me a motion and one contention to refute, then wait for my refutation.',
  },
];

export function findDrill(id?: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}
