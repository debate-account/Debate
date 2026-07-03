import { describe, it, expect } from 'vitest';
import { findFormat, roundLabel, parseSpeechTimers, criteriaFor, joinArgs, DEFAULT_CRITERIA } from './formats';

describe('findFormat', () => {
  it('finds known formats and "other"', () => {
    expect(findFormat('ld')?.name).toBe('Lincoln–Douglas');
    expect(findFormat('other')?.id).toBe('other');
  });
  it('returns undefined for unknown ids', () => {
    expect(findFormat('nope')).toBeUndefined();
    expect(findFormat(undefined)).toBeUndefined();
  });
});

describe('roundLabel', () => {
  it('capitalizes the NYDL mode', () => {
    expect(roundLabel({ id: 'nydl', name: 'NYDL / ESU', mode: 'prepared', speeches: [] })).toBe('Prepared');
    expect(roundLabel({ id: 'nydl', name: 'NYDL / ESU', mode: 'impromptu', speeches: [] })).toBe('Impromptu');
  });
  it('uses the format name otherwise', () => {
    expect(roundLabel({ id: 'ld', name: 'Lincoln–Douglas', speeches: [] })).toBe('Lincoln–Douglas');
  });
});

describe('parseSpeechTimers', () => {
  it('parses minutes into seconds and keeps the label', () => {
    expect(parseSpeechTimers(['1AC — 6 min', 'Cross-ex — 3 min', 'Constructive — 4 min each'])).toEqual([
      { label: '1AC', seconds: 360 },
      { label: 'Cross-ex', seconds: 180 },
      { label: 'Constructive', seconds: 240 },
    ]);
  });
  it('skips lines without a minute value', () => {
    expect(parseSpeechTimers(['4 teams, 8 speakers', 'You set the rules'])).toEqual([]);
  });
});

describe('criteriaFor', () => {
  it('returns the default three axes', () => {
    expect(criteriaFor('ld')).toBe(DEFAULT_CRITERIA);
    expect(criteriaFor('nydl').length).toBe(3);
  });
});

describe('NYDL integrity', () => {
  it('has prepared/impromptu modes and real speech times', () => {
    const nydl = findFormat('nydl')!;
    expect(nydl.modes?.map((m) => m.id)).toEqual(['prepared', 'impromptu']);
    expect(parseSpeechTimers(nydl.speeches).length).toBeGreaterThan(0);
  });
});

describe('progressiveArgs', () => {
  it('Policy and LD allow Ks, counterplans, and theory', () => {
    expect(findFormat('ld')?.progressiveArgs).toEqual(['Kritiks', 'counterplans', 'theory']);
    expect(findFormat('policy')?.progressiveArgs).toEqual(['Kritiks', 'counterplans', 'theory']);
  });
  it('PF allows Ks and theory but not counterplans', () => {
    expect(findFormat('pf')?.progressiveArgs).toEqual(['Kritiks', 'theory']);
  });
  it('parliamentary/traditional formats have none', () => {
    expect(findFormat('nydl')?.progressiveArgs).toBeUndefined();
    expect(findFormat('worlds')?.progressiveArgs).toBeUndefined();
    expect(findFormat('bp')?.progressiveArgs).toBeUndefined();
  });
});

describe('joinArgs', () => {
  it('formats lists naturally', () => {
    expect(joinArgs(['a'])).toBe('a');
    expect(joinArgs(['a', 'b'])).toBe('a and b');
    expect(joinArgs(['a', 'b', 'c'])).toBe('a, b, and c');
  });
});
