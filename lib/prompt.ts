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
  return knowledge
    ? instructions + '\n\n# PROJECT KNOWLEDGE (case documents & sample rounds)\n' + knowledge
    : instructions;
}
