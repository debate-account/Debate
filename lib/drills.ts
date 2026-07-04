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
    id: 'build',
    name: 'Build an argument',
    tag: 'Claim · Warrant · Impact',
    blurb: 'Get a motion and a side, then build one full Claim–Warrant–Impact argument. The coach scores each part.',
    brief:
      'This is an ARGUMENT-BUILDING DRILL — not a full debate round. Act as a focused coach.\n' +
      '1. Choose a motion and ASSIGN the debater a side. Ask them to make ONE complete argument for that side, structured as Claim → Warrant → Impact.\n' +
      '2. When they respond, evaluate each part:\n' +
      '   - Claim: a clear, single assertion?\n' +
      '   - Warrant: a real reasoning chain ("because…"), not just a restated claim, with a concrete example (and evidence if it were a prepared round)?\n' +
      '   - Impact: weighed — how much, to how many, how likely/soon?\n' +
      'Name which parts are strong, which are missing or thin, and give ONE concrete fix.\n' +
      '3. Score the argument out of 10, then offer another rep with a fresh motion/side.\n' +
      'Keep it tight. Do NOT run a full round or play an opponent.',
    kickoff: 'Start an argument-building drill. Give me a motion and my side, then wait for my Claim–Warrant–Impact argument.',
  },
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
  {
    id: 'flaw',
    name: 'Spot the flaw',
    tag: 'Diagnose a weakness',
    blurb: "The AI shows an argument with a hidden weakness — you name what's wrong. The coach confirms and explains.",
    brief:
      'This is a SPOT-THE-FLAW DRILL — not a full debate round. Act as a focused coach.\n' +
      '1. Present ONE argument (claim, warrant, impact) that contains a DELIBERATE weakness — vary it across reps: a missing or circular warrant, an unsupported claim, a broken link (non-sequitur), correlation treated as causation, a missing or trivial impact, or an overclaimed impact.\n' +
      "2. Ask the debater: what's the issue with this argument?\n" +
      '3. When they answer, say whether they found the main flaw, name any real flaws they missed, explain the key weakness in a sentence or two, and how a debater would exploit it in a round.\n' +
      '4. Score their diagnosis out of 10, then offer another rep with a different flaw type.\n' +
      'Keep it tight. Make the flaw genuine but findable; do NOT run a full round.',
    kickoff: "Start a spot-the-flaw drill. Give me one argument with a weakness and ask what's wrong with it, then wait for my answer.",
  },
];

export function findDrill(id?: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}
