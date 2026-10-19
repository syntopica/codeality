import { hasJob } from '../estate/hasJob.mjs'

/**
 * The root codeality.yml must hold this project's job. In a monorepo each
 * pubspec project has its own, and a missing one means that project's gate
 * runs nowhere while the others are green.
 */
export function checkGateJobs({ jobId, projectPath, codealityWorkflow }) {
  if (codealityWorkflow && hasJob(codealityWorkflow, jobId)) return []
  return [
    {
      id: 'dart-gate-job-missing',
      level: 'error',
      message: codealityWorkflow
        ? `codeality.yml has no job ${jobId} for ${projectPath}`
        : 'no .github/workflows/codeality.yml',
      detail: `Run \`codeality-dart init --ci --apply\` in ${projectPath}.`,
    },
  ]
}
