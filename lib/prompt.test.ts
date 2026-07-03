import { describe, it, expect } from 'vitest';
import { formatBrief } from './prompt';

describe('formatBrief', () => {
  it('is empty for undefined or a bare NYDL round', () => {
    expect(formatBrief(undefined)).toBe('');
    expect(formatBrief({ id: 'nydl' })).toBe('');
  });
  it('emits the drill brief in drill mode', () => {
    const out = formatBrief({ id: 'weighing', drill: true, brief: 'DO THE DRILL' });
    expect(out).toContain('DRILL MODE');
    expect(out).toContain('DO THE DRILL');
  });
  it('builds a format brief with times and criteria', () => {
    const out = formatBrief({ id: 'ld', name: 'Lincoln–Douglas', speeches: ['1AC — 6 min'], criteria: ['Content — x'] });
    expect(out).toContain('ROUND FORMAT: Lincoln–Douglas');
    expect(out).toContain('1AC — 6 min');
    expect(out).toContain('Content — x');
  });
  it('includes the custom description for "other"', () => {
    const out = formatBrief({ id: 'other', name: 'Other', desc: 'Karl Popper', speeches: [], criteria: [] });
    expect(out).toContain('Karl Popper');
  });
  it('emits a ROUND SETUP for NYDL with times/criteria', () => {
    const out = formatBrief({ id: 'nydl', name: 'NYDL / ESU', speeches: ['1st Prop — 5 min'], criteria: ['Content'] });
    expect(out).toContain('ROUND SETUP');
    expect(out).toContain('1st Prop — 5 min');
  });
});
