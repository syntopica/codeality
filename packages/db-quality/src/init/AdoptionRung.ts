import type { AdoptionPhaseNumber } from '@/init/AdoptionPhaseNumber.js'

/** One rung of the adoption ladder: what that phase means and the command that reaches the next one. */
export type AdoptionRung = {
  phase: AdoptionPhaseNumber
  does: string
  next: string
}
