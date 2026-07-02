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
