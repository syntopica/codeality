import type { StageOutcome } from '@/gate/StageOutcome.js'

export type Stage = { name: string; run: () => StageOutcome }
