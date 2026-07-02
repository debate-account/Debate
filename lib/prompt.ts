import fs from 'fs';
import path from 'path';

// System prompt = your debate instructions + any case docs / sample rounds in /knowledge.
// Mirrors the "project knowledge" mechanic from the Claude Project.
export function systemPrompt(): string {
  const root = process.cwd();
  const instructions = fs.readFileSync(path.join(root, 'debate-instructions.md'), 'utf8');

  let knowledge = '';
  const dir = path.join(root, 'knowledge');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (!/\.(md|txt)$/i.test(f)) continue; // text only for now
      knowledge += '\n\n----- ' + f + ' -----\n' + fs.readFileSync(path.join(dir, f), 'utf8');
    }
  }
  const base = knowledge
    ? instructions + '\n\n# PROJECT KNOWLEDGE (case documents & sample rounds)\n' + knowledge
    : instructions;

  return base + META_DIRECTIVES;
}

// When a non-NYDL format is chosen, tell the model to run the round by that
// format's rules and speech times. NYDL / ESU is the style the base
// instructions already assume, so it needs no brief.
export function formatBrief(format?: { id?: string; name?: string; desc?: string; speeches?: string[] }): string {
  if (!format || !format.id || format.id === 'nydl') return '';
  const parts = [`\n\n# ROUND FORMAT: ${format.name || format.id}`];
  if (format.desc) parts.push(`The debater describes this format as: ${format.desc}`);
  if (format.speeches && format.speeches.length) {
    parts.push('Speech structure and times:\n- ' + format.speeches.join('\n- '));
  }
  parts.push("Run the opponent, judge, and coach according to THIS format's roles, conventions, and speech times. Announce each speech and hold the structure, but keep the same coaching and judging quality as always.");
  return parts.join('\n');
}

// Machine-readable metadata the app parses out of replies for history + progress
// tracking. These lines are stripped before display (see lib/markdown.ts), so
// keep them on their own line, exactly in the formats below.
const META_DIRECTIVES = `

# APP METADATA (for the practice tracker — the user never sees these lines)
- As soon as the motion and the user's side are settled at the start of a round, output one line by itself:
  ROUND: {"motion": "<the motion>", "side": "<the user's side, e.g. Proposition/Opposition>"}
- Whenever you give a JUDGE verdict, end your reply with one line by itself scoring the user 0-10 on each axis:
  SCORES: {"content": <0-10>, "style": <0-10>, "strategy": <0-10>}
- Emit each line only when relevant, exactly once, as raw text (no code fences). Never mention or explain them.`;
