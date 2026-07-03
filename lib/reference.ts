// Reference shown in the in-app guide popup. Verbatim definitions.
export type RefItem = { term: string; def: string };

export const WEIGHING_REF: RefItem[] = [
  { term: 'Prerequisite', def: 'Your argument must happen or be solved first before theirs can even exist or be solved.' },
  { term: 'Magnitude', def: 'The sheer size, scale, or number of people affected by the impact.' },
  { term: 'Probability', def: 'The statistical likelihood or chance that the impact will actually happen.' },
  { term: 'Timeframe', def: 'How fast the impact occurs — prioritising immediate harms over distant ones.' },
  { term: 'Reversibility', def: 'Whether the damage is permanent or can be fixed and undone later.' },
  { term: 'Scope', def: 'The depth, severity, or systemic intensity of the harm on a specific group.' },
];

export const BUTTON_REF: RefItem[] = [
  { term: 'No Brink (B)', def: "The opponent's link or internal cause is too weak to create their claimed impact." },
  { term: 'Non-Unique (U)', def: "The opponent's feared impact will happen regardless of whether their plan is approved." },
  { term: 'Link Turn (T)', def: 'Your opponent has cause and effect backwards — their action leads to the exact opposite of what they want.' },
  { term: 'Impact Turn (T)', def: "Concede the opponent's action will occur, but argue the outcome is actually bad (or vice-versa)." },
  { term: 'Outweighs (O)', def: "Concede the opponent's argument might be true, but your side's impacts matter more (e.g. bigger scale, faster timeline)." },
];
