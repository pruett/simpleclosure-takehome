#!/usr/bin/env node
// Render the exact /goal prompt the loop sends to `claude` for ONE task card.
// It (1) validates the card against the schema's invariants — dependency-free, no npm — and
// (2) substitutes the card's fields into the AGENT_LOOP.md template.
//
// Usage: node scripts/format-prompt.mjs tasks/backlog/001-scaffold-nextjs.json
//   → prints the filled prompt on stdout (exit 0)
//   → on an invalid/malformed card, prints errors on stderr and exits non-zero (nothing on stdout)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const taskPath = process.argv[2];
if (!taskPath) { console.error('usage: format-prompt.mjs <task.json>'); process.exit(2); }

let task;
try {
  task = JSON.parse(readFileSync(taskPath, 'utf8'));
} catch (e) {
  console.error(`Cannot read/parse ${taskPath}: ${e.message}`);
  process.exit(3);
}

// --- validate the schema invariants that matter to the loop (see skills/tasks/task.schema.json) ---
const errs = [];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isStrArr = (v) => Array.isArray(v) && v.every(x => typeof x === 'string' && x.length > 0);
const idRe = /^[0-9]{3}-[a-z0-9]+(-[a-z0-9]+)*$/;
// Allowed `claude --model` values (keep in sync with task.schema.json's model enum).
const MODELS = [
  'opus', 'sonnet', 'haiku', 'fable',
  'claude-opus-4-8', 'claude-sonnet-5',
  'claude-haiku-4-5-20251001', 'claude-fable-5',
];

if (!isStr(task.id)) errs.push('id: required non-empty string');
else if (!idRe.test(task.id)) errs.push(`id "${task.id}": must be NNN-kebab-slug`);
else if (basename(taskPath).replace(/\.json$/, '') !== task.id)
  errs.push(`id "${task.id}" must equal the filename "${basename(taskPath)}"`);
if (!isStr(task.title)) errs.push('title: required non-empty string');
if (!isStr(task.goal)) errs.push('goal: required non-empty string');
if (!isStrArr(task.acceptance) || task.acceptance.length < 1)
  errs.push('acceptance: required, must be a non-empty array of non-empty strings');
for (const k of ['depends_on', 'skills', 'tests'])
  if (task[k] !== undefined && !isStrArr(task[k]) && !(Array.isArray(task[k]) && task[k].length === 0))
    errs.push(`${k}: must be a string[]`);
if (task.context !== undefined && typeof task.context !== 'string') errs.push('context: must be a string');
if (!MODELS.includes(task.model))
  errs.push(`model: required, must be one of ${MODELS.join(', ')}`);

if (errs.length) {
  console.error(`Invalid task card ${taskPath}:\n  - ${errs.join('\n  - ')}`);
  process.exit(4);
}

// --- render ---
// The template is a compact, ~constant-size procedure; the run reads goal/acceptance/context/
// skills/tests straight from the card file (@TASK_PATH), so the prompt does NOT inline them.
const template = readFileSync(join(repoRoot, 'AGENT_LOOP.md'), 'utf8');
const filled = template
  .replaceAll('{{TASK_PATH}}', taskPath)
  .replaceAll('{{ID}}', task.id)
  .replaceAll('{{TITLE}}', task.title);

// `/goal` caps the goal condition (the whole prompt) at 4000 chars — fail loud if we'd exceed it.
const GOAL_LIMIT = 4000;
if (filled.length > GOAL_LIMIT) {
  console.error(`Rendered prompt is ${filled.length} chars, over the /goal ${GOAL_LIMIT} limit. Shorten AGENT_LOOP.md or the task title.`);
  process.exit(5);
}

process.stdout.write(filled);
