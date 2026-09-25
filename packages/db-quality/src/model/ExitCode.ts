/** The four exit codes the CLI ever returns. A skipped required tool is never OK. */
export const ExitCode = {
  OK: 0,
  FINDINGS: 1,
  CONFIGURATION: 2,
  INFRASTRUCTURE: 3,
} as const
