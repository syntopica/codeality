import type { AdoptionPhaseNumber } from '@/init/AdoptionPhaseNumber.js'

/** The phase a project has reached, and the next step when it differs from the ladder's own. */
export type AdoptionStanding = { phase: AdoptionPhaseNumber; next?: string }
