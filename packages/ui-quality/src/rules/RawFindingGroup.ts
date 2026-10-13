import type { Measurement } from '@/model/Measurement.js'
import type { RawFinding } from '@/model/RawFinding.js'

export type RawFindingGroup = {
  first: RawFinding
  count: number
  worst: Measurement | undefined
}
