# career-ops-plugin-ats-score

A community plugin for [career-ops](https://github.com/career-ops-hq/career-ops).

## What it does

Scores the candidate behind your `cv.md` the way an automated resume screener would, out of 120: Open Source (35), Self Projects (30), Production (25), Technical Skills (10), plus up to 20 bonus points, minus deductions. Open Source is checked against your public GitHub activity, and only public, external contributions count.

It complements career-ops' built-in `ats` mode rather than overlapping it. `ats` checks whether a parser can read a generated CV. `ats-score` scores what the parsed content is worth, so you can fix the gaps a screener would penalize before you apply.

The rubric is adapted from HackerRank's open-source [`hiring-agent`](https://github.com/interviewstreet/hiring-agent) (MIT), turned around so the candidate scores themselves.

## How it works

The plugin has no runtime code. Everything is in `skill.md`, a rubric your agent pulls on demand:

```bash
node plugins.mjs skill ats-score
```

Then ask your agent "score my resume". The agent reads `cv.md`, `article-digest.md`, `config/profile.yml` and `modes/_profile.md`, runs a few read-only `gh api` queries against your public GitHub profile, and shows you the score.

The `ingest` hook is a stub that returns nothing. career-ops requires every plugin to declare at least one hook, and this one has nothing to fetch.

## What it writes

One file, `interview-prep/ats-score.md`, in your career-ops user layer. Each run is appended with its date and never overwrites earlier ones, so you can see the trend as your CV improves. It is a standalone report: no career-ops mode reads it, and the plugin never touches your tracker, reports or `cv.md`.

## Requirements

- The [`gh`](https://cli.github.com/) CLI, logged in, for the GitHub check. Without it the agent falls back to the public profile page and says so in the report.
- No API keys, no `.env` entries, no network access from the plugin itself.

## Install

```bash
# Once it's in the career-ops registry:
node plugins.mjs add ats-score

# Before listing (install directly from this repo at a pinned commit):
node plugins.mjs add jashan190/career-ops-plugin-ats-score --sha <40-hex-commit>
```

Then enable it:

```bash
node plugins.mjs enable ats-score            # shows the capability card
node plugins.mjs enable ats-score --confirm  # grants it
```

## Develop

```bash
npm test   # zero-network: smoke test + rubric content checks
```

To try local changes, symlink this checkout into `plugins.local/ats-score` inside your career-ops repo.

## License

MIT. The rubric's HackerRank notice is reproduced in full in `skill.md`.
