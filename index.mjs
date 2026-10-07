// @ts-check
// ats-score: a career-ops plugin.
// Guide: https://github.com/career-ops-hq/career-ops/blob/main/docs/PLUGINS.md
//
// This plugin does not source jobs and makes no network calls of its own. The
// real surface is skill.md, a scoring rubric the agent pulls with
// `node plugins.mjs skill ats-score`. The ingest hook is declared only so the
// manifest satisfies the engine's non-empty hooks[] requirement, the same
// shape the bundled h1b-sponsor plugin uses.
export default {
  async ingest(_ctx) {
    return [];
  },
};
