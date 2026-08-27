// A workflow that fires on the events code arrives through. A pipeline that
// only runs on `workflow_dispatch` or a schedule is not a gate: nothing stops
// a push that breaks it.
const AUTOMATIC_TRIGGER = /^\s*(?:push|pull_request|pull_request_target)\s*:/m

/**
 * Something has to run the gates on every push.
 *
 * lefthook's pre-commit lints staged files and its pre-push scans for secrets;
 * neither runs type-check, tests, knip, jscpd, dependency-cruiser or
 * type-coverage. Without a workflow those gates have no automatic trigger
 * anywhere, which described eight of seventeen adopters at the time this check
 * was written - every one of them with the full gate set installed as scripts.
 *
 * A hook is also skippable (`--no-verify`) and a local machine is not a clean
 * install; CI is the only place a gate is actually mandatory.
 *
 * Which gates the pipeline runs is `checkGateCoverage`'s question, and it
 * reads them off these same workflows. This check only asks whether there is a
 * pipeline and whether code arriving in the repository triggers it.
 */
export function checkCiWorkflow({ workflows }) {
  if (!workflows.length) {
    return [
      {
        id: 'ci-workflow',
        level: 'error',
        message: 'no GitHub Actions workflow',
        detail:
          'The gates are installed and unreachable: nothing runs them on ' +
          'push. `create-baseline --write` writes .github/workflows/ci.yml.',
        fix: { kind: 'write-workflow' },
      },
    ]
  }

  if (workflows.some((workflow) => AUTOMATIC_TRIGGER.test(workflow.text))) {
    return []
  }

  return [
    {
      id: 'ci-workflow',
      level: 'error',
      message: 'no workflow runs on push or pull request',
      detail:
        `Workflows present (${workflows.map((w) => w.name).join(', ')}) but ` +
        'every one of them is manual or scheduled, so nothing gates the code ' +
        'that arrives between runs.',
    },
  ]
}
