import { hasJob } from '../estate/hasJob.mjs'

/** The root codeality.yml must hold the `swift` job codeality-swift init writes. */
export function checkSwiftGateJob({ codealityWorkflow }) {
  if (codealityWorkflow && hasJob(codealityWorkflow, 'swift')) return []
  return [
    {
      id: 'swift-gate-job-missing',
      level: 'error',
      message: codealityWorkflow
        ? 'codeality.yml has no swift job'
        : 'no .github/workflows/codeality.yml',
      detail: 'Run `codeality-swift init --ci --apply`.',
    },
  ]
}
