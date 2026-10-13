import type { StageStatus } from '@/gate/StageStatus.js'
import type { Diagnostic } from '@syntopica/gate-kit/Diagnostic'

export type StageResult = {
  name: string
  status: StageStatus
  durationSeconds: number
  detail: string
  diagnostics: Diagnostic[]
}
