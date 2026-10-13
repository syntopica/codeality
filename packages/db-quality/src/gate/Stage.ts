import type { StageOutcome } from '@/gate/StageOutcome.js'
import type { Finding } from '@/model/Finding.js'

/** One gate stage; `rerun` names the command that checks one of its findings again. */
export type Stage = {
  name: string
  run: () => StageOutcome
  rerun?: (finding: Finding) => string
}
