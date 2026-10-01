import type { StageResult } from '@/gate/StageResult.js'
import { ExitCode } from '@syntopica/gate-kit/ExitCode'

export const gateExitCode = (results: StageResult[]): number => {
  if (results.some((result) => result.status === 'failed-to-run'))
    return ExitCode.INFRASTRUCTURE
  if (results.some((result) => result.status === 'findings'))
    return ExitCode.FINDINGS
  return ExitCode.OK
}
