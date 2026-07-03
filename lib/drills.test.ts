import { describe, it, expect } from 'vitest';
import { findDrill, DRILLS } from './drills';

describe('drills', () => {
  it('has weighing and rebuttal', () => {
    expect(DRILLS.map((d) => d.id).sort()).toEqual(['rebuttal', 'weighing']);
  });
  it('findDrill resolves ids', () => {
    expect(findDrill('weighing')?.name).toBe('Weighing');
    expect(findDrill('nope')).toBeUndefined();
  });
  it('rebuttal grades on BUTTON and weighing assigns a side', () => {
    expect(findDrill('rebuttal')!.brief).toMatch(/BUTTON/);
    expect(findDrill('weighing')!.brief).toMatch(/ASSIGN/i);
  });
  it('every drill has a kickoff and a blurb', () => {
    for (const d of DRILLS) {
      expect(d.kickoff.length).toBeGreaterThan(0);
      expect(d.blurb.length).toBeGreaterThan(0);
    }
  });
});
