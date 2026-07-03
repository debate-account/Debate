import { describe, it, expect } from 'vitest';
import { formatBrief, systemPrompt } from './prompt';

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
  it("blocks the format's advanced args in traditional mode", () => {
    const out = formatBrief({ id: 'ld', name: 'Lincoln–Douglas', speeches: ['1AC — 6 min'], progressiveArgs: ['Kritiks', 'counterplans', 'theory'], argMode: 'traditional' });
    expect(out).toMatch(/TRADITIONAL/);
    expect(out).toMatch(/do NOT run Kritiks, counterplans, and theory/);
  });
  it('permits them in progressive mode, per the format list', () => {
    const out = formatBrief({ id: 'pf', name: 'Public Forum', speeches: ['Constructive — 4 min each'], progressiveArgs: ['Kritiks', 'theory'], argMode: 'progressive' });
    expect(out).toMatch(/PROGRESSIVE/);
    expect(out).toContain('Kritiks and theory are permitted');
  });
  it('adds no argument-style line when the format has no progressive args', () => {
    const out = formatBrief({ id: 'worlds', name: 'World Schools', speeches: ['Substantive — 8 min'], argMode: 'traditional' });
    expect(out).not.toMatch(/Argument style/);
  });
});

describe('systemPrompt', () => {
  it('carries the non-negotiable behaviour rules', () => {
    const s = systemPrompt();
    expect(s).toMatch(/there is no perfect response/i); // no false perfection
    expect(s).toMatch(/speech order/i);                 // hold the order
    expect(s).toMatch(/ad hominem/i);                   // no personal attacks
  });
});
