import type { Finding } from '@/model/Finding.js'
import type { Observation } from '@/model/Observation.js'

/** What a command prints: the findings that fail it and the observations that do not. */
export type Report = {
  findings: Finding[]
  observations: Observation[]
}
