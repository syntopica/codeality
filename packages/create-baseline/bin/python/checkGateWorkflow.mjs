const AUTOMATIC_TRIGGER = /^\s*(?:push|pull_request|pull_request_target)\s*:/m
const RUNS_GATE = /\bbaseline-py\s+gate\b/

/**
 * Something has to run `baseline-py gate` on every push.
 *
 * The 2026-09-01 audit found every adopted repository green locally and not
 * one of them running the gate anywhere else; one still ran its
 * pre-adoption pip-and-pytest workflow beside a full quality group it never
 * installed. A hook is skippable and a laptop is not a clean install; CI is
 * the only place the gate is mandatory.
 */
export function checkGateWorkflow({ workflows }) {
  const gated = workflows.filter((workflow) => RUNS_GATE.test(workflow.text))
  if (gated.some((workflow) => AUTOMATIC_TRIGGER.test(workflow.text))) {
    return []
  }
  const message = gated.length
    ? 'the workflow running baseline-py gate is manual or scheduled'
    : workflows.length
      ? 'no workflow runs baseline-py gate'
      : 'no GitHub Actions workflow'
  return [
    {
      id: 'py-ci-workflow',
      level: 'error',
      message,
      detail:
        'The gate is installed and unreachable: nothing runs it on push. ' +
        '`baseline-py init --ci --apply` writes .github/workflows/quality.yml.',
    },
  ]
}
