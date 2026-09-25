import { runStage } from '@/gate/runStage.js'
import type { Stage } from '@/gate/Stage.js'
import type { StageResult } from '@/gate/StageResult.js'

// Every stage runs: stopping at the first failure means the same tool is
// fixed over and over and the rest of the picture never appears.
export const runGate = (stages: Stage[]): StageResult[] => stages.map(runStage)
