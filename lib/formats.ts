// Debate formats shown in the picker. NYDL / ESU is the home style and holds the
// prepared / impromptu sub-modes; the others carry their standard speech times.

export type Mode = { id: string; name: string; blurb: string };

export type Format = {
  id: string;
  name: string;
  tag: string;          // short label shown as a chip
  blurb: string;
  speeches: string[];   // rendered under the card, and fed to the AI
  cls: 'prep' | 'impromptu';
  modes?: Mode[];       // only NYDL / ESU
};

// What a started round carries into Chat + the API.
export type RoundFormat = {
  id: string;
  name: string;
  mode?: string;        // nydl: 'prepared' | 'impromptu'
  desc?: string;        // other: the user's custom description
  speeches: string[];
  criteria?: string[];  // judging criteria (editable in the briefing)
  drill?: boolean;      // skill drill instead of a full round
  brief?: string;       // drill: system-prompt brief
  kickoff?: string;     // drill: message that starts it
  intro?: string;       // drill: pre-drill description
};

// Default judging axes — aligned with the judge's SCORES (content/style/strategy).
export const DEFAULT_CRITERIA = [
  'Content — argument quality, evidence, and direct clash',
  'Style — delivery, clarity, and persuasion',
  'Strategy — structure, prioritization, and use of time',
];

// Editable placeholder schedule for formats without fixed times (NYDL / custom).
export const DEFAULT_SPEECHES = [
  'Opening — 5 min',
  'Rebuttal — 3 min',
  'Closing — 3 min',
];

export const FORMATS: Format[] = [
  {
    id: 'nydl',
    name: 'NYDL / ESU',
    tag: 'Home league',
    blurb: 'New York Debate League (English-Speaking Union) style. Choose a prepared or impromptu round next.',
    speeches: [
      '1st Proposition — 5 min',
      'Cross-examination — 2 min',
      '1st Opposition — 5 min',
      'Cross-examination — 2 min',
      '2nd Proposition — 5 min',
      '2nd Opposition — 5 min',
    ],
    cls: 'prep',
    modes: [
      { id: 'prepared', name: 'Prepared round', blurb: 'You know the motion ahead of time. Build a case with contentions and real evidence, then defend it against a full opposing bench.' },
      { id: 'impromptu', name: 'Impromptu round', blurb: 'Get a surprise motion and a few minutes to prep. Think on your feet with claim, warrant, and impact — no evidence needed.' },
    ],
  },
  {
    id: 'ld',
    name: 'Lincoln–Douglas',
    tag: '1v1 · value',
    blurb: 'One-on-one values debate. Framework, contentions, and clash over a resolution of principle.',
    speeches: ['1AC — 6 min', 'Cross-ex — 3 min', '1NC — 7 min', 'Cross-ex — 3 min', '1AR — 4 min', 'NR — 6 min', '2AR — 3 min'],
    cls: 'impromptu',
  },
  {
    id: 'pf',
    name: 'Public Forum',
    tag: '2v2 · current events',
    blurb: 'Two-on-two on a current-events resolution, argued for a lay judge.',
    speeches: ['Constructive — 4 min each', 'Crossfire — 3 min', 'Rebuttal — 4 min each', 'Crossfire — 3 min', 'Summary — 3 min each', 'Grand Crossfire — 3 min', 'Final Focus — 2 min each'],
    cls: 'prep',
  },
  {
    id: 'policy',
    name: 'Policy (CX)',
    tag: '2v2 · evidence-heavy',
    blurb: 'Two-on-two, evidence-intensive debate over a policy resolution.',
    speeches: ['Constructive — 8 min', 'Cross-ex — 3 min', 'Rebuttal — 5 min', 'Prep time — 8 min'],
    cls: 'impromptu',
  },
  {
    id: 'bp',
    name: 'British Parliamentary',
    tag: '4 teams · 8 speakers',
    blurb: 'Four two-person teams across Gov and Opp benches; extend and whip.',
    speeches: ['Speech — 7 min', 'Prep — 15 min'],
    cls: 'prep',
  },
  {
    id: 'worlds',
    name: 'World Schools',
    tag: '3v3 · mixed',
    blurb: 'Three-on-three mixing prepared and impromptu motions; substantive plus reply speeches.',
    speeches: ['Substantive — 8 min', 'Reply — 4 min'],
    cls: 'impromptu',
  },
];

export const OTHER: Format = {
  id: 'other',
  name: 'Other / custom',
  tag: 'Describe it',
  blurb: "Don't see your format? Describe its structure and speech times — your opponent and judge will run the round that way.",
  speeches: ['You set the rules'],
  cls: 'prep',
};

export function findFormat(id?: string): Format | undefined {
  if (id === 'other') return OTHER;
  return FORMATS.find((f) => f.id === id);
}

// Judging criteria for a format (same three axes as the score rubric for now).
export function criteriaFor(_id?: string): string[] {
  return DEFAULT_CRITERIA;
}

// Human label stored on a saved round / shown in history.
export function roundLabel(f: RoundFormat): string {
  if (f.id === 'nydl' && f.mode) return f.mode[0].toUpperCase() + f.mode.slice(1);
  return f.name;
}

// Parse "1AC — 6 min", "Constructive — 4 min each" etc. into timer entries.
export function parseSpeechTimers(speeches: string[]): { label: string; seconds: number }[] {
  const out: { label: string; seconds: number }[] = [];
  for (const line of speeches) {
    const m = line.match(/(\d+(?:\.\d+)?)\s*min/i);
    if (!m) continue;
    const seconds = Math.round(parseFloat(m[1]) * 60);
    const label = line.replace(/[—-]?\s*\d+(?:\.\d+)?\s*min.*$/i, '').replace(/[—-]\s*$/, '').trim() || line;
    out.push({ label, seconds });
  }
  return out;
}
