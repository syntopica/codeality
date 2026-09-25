import type { StageStatus } from '@/gate/StageStatus.js'

export type StageResult = {
  name: string
  status: StageStatus
  durationSeconds: number
  detail: string
}
