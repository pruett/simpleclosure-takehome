#!/usr/bin/env node
// Deterministic backlog selector for run-backlog.sh (kanban layout).
// Swimlanes are sibling directories under tasks/: backlog, in_progress, blocked, done.
// One JSON file per unit of work (see skills/tasks/task.schema.json); the file's LANE
// (directory) IS its status, its id is the filename without ".json". Ordering is lexical
// by filename (numeric prefix). Prints exactly one token on stdout:
//   tasks/<lane>/<id>.json  → path of the next task to build (first actionable task whose depends_on are all done)
//   DONE       → no backlog/in_progress tasks remain (and none blocked)
//   BLOCKED    → a task sits in tasks/blocked/ (stop for human review)
//   STUCK      → actionable tasks remain but none have their depends_on satisfied (bad deps / cycle)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'tasks');
const lane = (name) => {
  const dir = join(root, name);
  return existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).sort() : [];
};
const idOf = (f) => f.replace(/\.json$/, '');

if (lane('blocked').length) { console.log('BLOCKED'); process.exit(0); }

const done = new Set(lane('done').map(idOf));

const depsOf = (laneName, file) => {
  try {
    const task = JSON.parse(readFileSync(join(root, laneName, file), 'utf8'));
    return Array.isArray(task.depends_on) ? task.depends_on : [];
  } catch { return []; }
};

// Resume a claimed-but-unfinished task first (in_progress), then start fresh from backlog.
const candidates = [
  ...lane('in_progress').map(f => ['in_progress', f]),
  ...lane('backlog').map(f => ['backlog', f]),
];

const next = candidates.find(([l, f]) => depsOf(l, f).every(d => done.has(d)));

if (next) console.log(`tasks/${next[0]}/${next[1]}`);
else if (candidates.length === 0) console.log('DONE');
else console.log('STUCK');
