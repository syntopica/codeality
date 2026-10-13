import type { Fingerprinted } from './Fingerprinted.js'

export type ClassifiedFindings<F extends Fingerprinted> = {
  new: F[]
  known: F[]
  /** The part of `new` that is a known finding measured worse than recorded. */
  worsened: F[]
  resolved: string[]
}
