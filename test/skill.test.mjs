// Zero-network content checks for skill.md, the plugin's real surface. They pin
// the parts of the rubric that are load-bearing for a score: the fairness
// constraint, the MIT notice the rubric is derived under, the contributions
// lookup that drives the heaviest category, and the fixed link-quality table.
// Plus the plugin's own contract: no egress, no keys, nothing the career-ops
// skill loader would flag.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(path.join(here, '..', rel), 'utf8');
const skill = read('skill.md');
const manifest = JSON.parse(read('manifest.json'));
const entry = read(manifest.entry || 'index.mjs');

let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failed++;
};

check(
  /never.{0,10}depend on:.{0,10}name, gender/i.test(skill) &&
    /hiring-agent/i.test(skill) &&
    /MIT licensed/i.test(skill) &&
    /Open Source \(0-35/i.test(skill) &&
    /Self Projects \(0-30/i.test(skill) &&
    /Production \(0-25/i.test(skill) &&
    /Technical Skills \(0-10/i.test(skill) &&
    /interview-prep\/ats-score\.md.{0,20}create if missing/i.test(skill) &&
    /do not overwrite prior runs/i.test(skill),
  'fairness constraint, HackerRank attribution, all 4 categories, append-only output rule',
);

// The calibration note needs the candidate's OWN target archetypes, which live
// in modes/_profile.md. A plugin skill is pulled on demand, so nothing else is
// guaranteed to be in context: the skill has to tell the agent to read it.
check(
  /Read `modes\/_profile\.md` for the candidate's own target archetypes/.test(skill) &&
    /`modes\/_profile\.md` carries the candidate's own target archetypes/.test(skill),
  'calibration note cites modes/_profile.md, and Inputs tells the agent to read it',
);

// The contributions lookup drives the heaviest-weighted category, so it must
// stay on the query-string form (`-f` POSTs and 404s on search), stay
// public-only (the token can otherwise reach private repos a real ATS never
// sees), and keep excluding self-owned PRs from the external count.
const searchQueries = skill.match(/search\/issues\?q=[^"'`\s]*/g) ?? [];
check(
  /gh api "search\/issues\?q=author:\{username\}\+type:pr/.test(skill) &&
    searchQueries.length > 0 &&
    searchQueries.every((q) => q.includes('is:public')) &&
    /is:public\+-user:\{username\}/.test(skill),
  'contributions search: query-string form, public-only, self-owned PRs excluded',
);

// The events fallback has to apply the same owner filter as the search, or a
// candidate who only pushes to their own repos scores as an external
// contributor. Both exclusions are pinned: non-push event types, and pushes to
// a self-owned repo. So is the `public` flag: the candidate's own token makes
// this endpoint return private events too (seen live: pushes to a private org
// repo, `"public": false`), and those pass the owner filter.
const fallback = skill.slice(skill.indexOf('events/public'), skill.indexOf('users/{username}/repos'));
check(
  fallback.length > 0 &&
    /`public` field is `true`/.test(fallback) &&
    /`type` is `PushEvent`/.test(fallback) &&
    /`repo\.name`/.test(fallback) &&
    /differs from `\{username\}`, compared case-insensitively/.test(fallback) &&
    /Drop every other event type/.test(fallback) &&
    /every push to a self-owned repository/.test(fallback),
  'events fallback counts only public PushEvents to repos the candidate does not own (case-insensitive)',
);

// The link-quality adjustment feeds a score, so it has to be a function, not a
// judgement call: four mutually exclusive rows with fixed multipliers.
const linkTable = skill.slice(skill.indexOf('**Link penalty'), skill.indexOf('### Production'));
check(
  /\| yes \| yes \| 1\.15 \|/.test(linkTable) &&
    /\| yes \| no \| 0\.80 \|/.test(linkTable) &&
    /\| no \| yes \| 0\.70 \|/.test(linkTable) &&
    /\| no \| no \| 0\.60 \|/.test(linkTable) &&
    !/\d\s*to\s*0?\.\d/.test(linkTable),
  'link table covers all 4 link/demo combinations with fixed multipliers',
);

// Clamping the sum afterwards lets a second strong project absorb the first
// one's link penalty, so raw scores are bounded to 30 BEFORE multipliers.
check(
  /bound them before they become points/.test(linkTable) &&
    /scale every one of them by 30 divided by that sum/.test(linkTable) &&
    /apply each project's multiplier to its own bounded score/.test(linkTable),
  'per-project scores are bounded to 30 before multipliers apply',
);

// MIT requires the copyright and permission notice travel with the derived work.
check(
  /Copyright \(c\) 2025 HackerRank/.test(skill) &&
    /Permission is hereby granted, free of charge/.test(skill) &&
    /THE SOFTWARE IS PROVIDED "AS IS"/.test(skill),
  'full hiring-agent MIT notice is carried',
);

// `gh api` switches to POST the moment a -f/-F param is supplied, and GET-only
// endpoints answer POST with a 404. Every prescribed call must be a read.
const postByAccident = (skill.match(/\bgh api\b[^\n`]*/g) ?? []).filter(
  (cmd) => /\s(?:-f|-F|--field|--raw-field)[\s=]/.test(cmd) && !/\s(?:-X|--method)\s/.test(cmd),
);
check(postByAccident.length === 0, `no gh api call that -f silently turns into a POST${postByAccident.length ? `: ${postByAccident.join(' | ')}` : ''}`);

// career-ops' skill loader flags a skill containing these as possible prompt
// injection. Mirrors SKILL_RED_FLAGS in plugins/_engine.mjs.
const redFlags = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instruction/i,
  /disregard\s+(the\s+)?(system|above|previous)/i,
  /you\s+are\s+now\b/i,
  /exfiltrat/i,
  new RegExp('modes/' + '_shared'),
  new RegExp('AGENTS' + '\\.md'),
  /human[- ]?in[- ]?the[- ]?loop\s*[:=]?\s*false/i,
];
const hits = redFlags.filter((re) => re.test(skill));
check(hits.length === 0, `skill.md trips none of the loader's injection red flags${hits.length ? `: ${hits.join(', ')}` : ''}`);

// The plugin itself never touches the network or a secret: the agent runs the
// gh calls, under the user's own eyes.
check(
  manifest.humanInTheLoop === true &&
    (manifest.requiredEnv ?? []).length === 0 &&
    (manifest.allowedHosts ?? []).length === 0 &&
    !/\bfetch\s*\(|node:(http|https|net|child_process)|from ['"](http|https|net|child_process)['"]/.test(entry),
  'no egress, no keys, no network or process imports in the entry',
);

// The ingest hook is a stub, so a run must say where the scorer actually is
// rather than ending on a bare "0 found" (the same courtesy h1b-sponsor's stub
// extends). Run it for real with a fake ctx and check what it says.
const logged = [];
const result = await (await import(path.join(here, '..', manifest.entry || 'index.mjs'))).default.ingest({
  log: (...args) => logged.push(args.join(' ')),
});
check(
  Array.isArray(result) && result.length === 0 && logged.some((l) => l.includes('node plugins.mjs skill ats-score')),
  'stub ingest returns no jobs and logs where the real surface is',
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
