import { hasJob } from '../estate/hasJob.mjs'

/** The root codeality.yml must hold the job codeality-go init writes for this module. */
export function checkGoGateJob({ codealityWorkflow, jobId }) {
  if (codealityWorkflow && hasJob(codealityWorkflow, jobId)) return []
  return [
    {
      id: 'go-gate-job-missing',
      level: 'error',
      message: codealityWorkflow
        ? `codeality.yml has no ${jobId} job`
        : 'no .github/workflows/codeality.yml',
      detail: 'Run `codeality-go init --ci --apply`.',
    },
  ]
}
