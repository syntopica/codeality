import type { CheckContext } from '@/check/CheckContext.js'
import { adoptionPhase } from '@/init/adoptionPhase.js'
import type { AdoptionStanding } from '@/init/AdoptionStandingType.js'
import { baselineStep } from '@/init/baselineStep.js'

/**
 * The phase from the recorded files, held at 1 while `check` reports findings
 * the baseline does not cover: committing the init output alone must never
 * turn CI red.
 */
export const adoptionStanding = (context: CheckContext): AdoptionStanding => {
  const phase = adoptionPhase(context.root, context.config)
  if (phase === 0) return { phase }
  const step = baselineStep(context)
  return step === 'covered'
    ? { phase }
    : { phase: 1, next: `codeality-db baseline ${step}` }
}
