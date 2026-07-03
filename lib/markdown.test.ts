import { describe, it, expect } from 'vitest';
import { renderMarkdown, stripMeta, parseRoundMeta, scoreTotal } from './markdown';

describe('renderMarkdown', () => {
  it('renders bold, italic, and code', () => {
    expect(renderMarkdown('**b**')).toContain('<strong>b</strong>');
    expect(renderMarkdown('*i*')).toContain('<em>i</em>');
    expect(renderMarkdown('`c`')).toContain('<code>c</code>');
  });
  it('escapes HTML', () => {
    expect(renderMarkdown('<script>')).toContain('&lt;script&gt;');
    expect(renderMarkdown('a & b')).toContain('a &amp; b');
  });
  it('renders headings and lists', () => {
    expect(renderMarkdown('# Title')).toContain('<h3>Title</h3>');
    const ul = renderMarkdown('- one\n- two');
    expect(ul).toContain('<ul>');
    expect((ul.match(/<li>/g) || []).length).toBe(2);
    expect(renderMarkdown('1. a\n2. b')).toContain('<ol>');
  });
  it('wraps a plain line in a paragraph', () => {
    expect(renderMarkdown('hello')).toBe('<p>hello</p>');
  });
});

describe('stripMeta', () => {
  it('removes ROUND and SCORES lines but keeps prose', () => {
    const src = 'Nice work.\nROUND: {"motion":"m","side":"Prop"}\nSCORES: {"content":8,"style":7,"strategy":6}';
    const out = stripMeta(src);
    expect(out).toContain('Nice work.');
    expect(out).not.toContain('ROUND:');
    expect(out).not.toContain('SCORES:');
  });
  it('leaves normal text untouched', () => {
    expect(stripMeta('just text')).toBe('just text');
  });
});

describe('parseRoundMeta', () => {
  it('extracts motion, side, and scores from a transcript', () => {
    const messages = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'ROUND: {"motion":"THW ban cars","side":"Opposition"}' },
      { role: 'assistant', content: 'SCORES: {"content":8,"style":6,"strategy":7}' },
    ];
    const { motion, side, scores } = parseRoundMeta(messages);
    expect(motion).toBe('THW ban cars');
    expect(side).toBe('Opposition');
    expect(scores).toEqual({ content: 8, style: 6, strategy: 7 });
  });
  it('returns nulls when metadata is absent', () => {
    const { motion, side, scores } = parseRoundMeta([{ role: 'assistant', content: 'no meta' }]);
    expect(motion).toBeNull();
    expect(side).toBeNull();
    expect(scores).toBeNull();
  });
  it('ignores malformed JSON', () => {
    const { scores } = parseRoundMeta([{ role: 'assistant', content: 'SCORES: {broken' }]);
    expect(scores).toBeNull();
  });
});

describe('scoreTotal', () => {
  it('sums the three axes', () => {
    expect(scoreTotal({ content: 8, style: 6, strategy: 7 })).toBe(21);
  });
  it('returns null when there are no numbers', () => {
    expect(scoreTotal(null)).toBeNull();
    expect(scoreTotal({})).toBeNull();
  });
});
