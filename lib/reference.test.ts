import { describe, it, expect } from 'vitest';
import { WEIGHING_REF, BUTTON_REF } from './reference';

describe('reference', () => {
  it('weighing lists the six mechanisms', () => {
    expect(WEIGHING_REF.map((r) => r.term)).toEqual([
      'Prerequisite', 'Magnitude', 'Probability', 'Timeframe', 'Reversibility', 'Scope',
    ]);
  });
  it('BUTTON lists the five techniques', () => {
    expect(BUTTON_REF.map((r) => r.term)).toEqual([
      'No Brink (B)', 'Non-Unique (U)', 'Link Turn (T)', 'Impact Turn (T)', 'Outweighs (O)',
    ]);
  });
  it('every item has a definition', () => {
    for (const r of [...WEIGHING_REF, ...BUTTON_REF]) expect(r.def.length).toBeGreaterThan(0);
  });
});
