// @ts-check
// ats-score: a career-ops plugin.
// Guide: https://github.com/career-ops-hq/career-ops/blob/main/docs/PLUGINS.md
//
// This plugin does not source jobs and makes no network calls of its own. The
// real surface is skill.md, a scoring rubric the agent pulls with
// `node plugins.mjs skill ats-score`. The ingest hook is declared only so the
// manifest satisfies the engine's non-empty hooks[] requirement, the same
// shape the bundled h1b-sponsor plugin uses, so a run says where the scorer
// is instead of leaving a bare "0 found".
export default {
  async ingest(ctx) {
    ctx.log('ats-score finds no jobs. It is a rubric your agent follows: load it with `node plugins.mjs skill ats-score`, then ask your agent to score your resume.');
    return [];
  },
};
