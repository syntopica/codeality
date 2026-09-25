import type { CheckContext } from '@/check/CheckContext.js'
import { adoptionPhase } from '@/init/adoptionPhase.js'
import type { AdoptionStanding } from '@/init/AdoptionStandingType.js'
import { baselineStep } from '@/init/baselineStep.js'
import type { BaselineStep } from '@/init/BaselineStepType.js'

/**
 * The phase from the recorded files, held at 1 while `check` reports findings
 * the baseline does not cover: committing the init output alone must never
 * turn CI red. A check that cannot run holds phase 1 too, naming why, and
 * never changes init's own exit code.
 */
export const adoptionStanding = (context: CheckContext): AdoptionStanding => {
  const phase = adoptionPhase(context.root, context.config)
  if (phase === 0) return { phase }
  let step: BaselineStep
  try {
    step = baselineStep(context)
  } catch (error) {
    return { phase: 1, next: `make check run: ${(error as Error).message}` }
  }
  return step === 'covered'
    ? { phase }
    : { phase: 1, next: `codeality-db baseline ${step}` }
}
