// Minimal, safe Markdown -> HTML for opponent/judge/coach replies, plus helpers
// to extract and strip the hidden metadata lines the model emits (see lib/prompt.ts).

export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inline(s: string) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
export function renderMarkdown(src: string) {
  const lines = escapeHtml(src).split('\n');
  let html = '';
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (h) { closeList(); const lvl = Math.min(h[1].length + 2, 5); html += `<h${lvl}>${inline(h[2])}</h${lvl}>`; }
    else if (ul) { if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(ul[1])}</li>`; }
    else if (ol) { if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(ol[1])}</li>`; }
    else if (line === '') { closeList(); }
    else { closeList(); html += `<p>${inline(line)}</p>`; }
  }
  closeList();
  return html;
}

// The model emits machine-readable lines we don't want shown to the user:
//   ROUND: {"motion": "...", "side": "..."}
//   SCORES: {"content": N, "style": N, "strategy": N}
const META_LINE = /^\s*(ROUND|SCORES):\s*\{.*\}\s*$/gm;

export function stripMeta(content: string) {
  return content.replace(META_LINE, '').replace(/\n{3,}/g, '\n\n').trim();
}

function lastJson(messages: { role: string; content: string }[], key: 'ROUND' | 'SCORES') {
  const re = new RegExp(`^\\s*${key}:\\s*(\\{.*\\})\\s*$`, 'm');
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i].content?.match(re);
    if (m) { try { return JSON.parse(m[1]); } catch { /* ignore malformed */ } }
  }
  return null;
}

export type Scores = { content?: number; style?: number; strategy?: number };

// Pull motion/side/scores out of a transcript for saving to the rounds table.
export function parseRoundMeta(messages: { role: string; content: string }[]) {
  const round = lastJson(messages, 'ROUND') || {};
  const scores = lastJson(messages, 'SCORES') as Scores | null;
  return {
    motion: typeof round.motion === 'string' ? round.motion : null,
    side: typeof round.side === 'string' ? round.side : null,
    scores,
  };
}

export function scoreTotal(s: Scores | null | undefined): number | null {
  if (!s) return null;
  const parts = [s.content, s.style, s.strategy].filter((n) => typeof n === 'number') as number[];
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
}
