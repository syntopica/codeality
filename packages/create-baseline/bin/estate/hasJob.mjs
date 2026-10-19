/** Whether `workflow` defines job `jobId` directly under `jobs:`. */
export function hasJob(workflow, jobId) {
  return workflow.split('\n').some((line) => line.trimEnd() === `  ${jobId}:`)
}
