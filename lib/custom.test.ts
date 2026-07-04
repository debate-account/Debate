import { describe, it, expect } from 'vitest';
import { splitLines, customDrillBrief, customDrillKickoff } from './custom';

describe('custom formats & drills', () => {
  it('splitLines trims and drops blanks', () => {
    expect(splitLines('a\n  b  \n\n c')).toEqual(['a', 'b', 'c']);
    expect(splitLines('')).toEqual([]);
    expect(splitLines(null)).toEqual([]);
  });

  it('customDrillBrief includes the name and the practice instructions', () => {
    const b = customDrillBrief({ id: '1', name: 'POI handling', instructions: 'Take and answer points of information.' });
    expect(b).toMatch(/POI handling/);
    expect(b).toMatch(/points of information/i);
    expect(b).toMatch(/DRILL/);
  });

  it('customDrillBrief falls back when instructions are empty', () => {
    const b = customDrillBrief({ id: '1', name: 'Signposting' });
    expect(b).toMatch(/Signposting/);
  });

  it('customDrillKickoff names the drill', () => {
    expect(customDrillKickoff({ id: '1', name: 'Rebuttal speed' })).toMatch(/Rebuttal speed/);
  });
});
