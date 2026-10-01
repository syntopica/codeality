import type { Fingerprinted } from './Fingerprinted.js'

export type ClassifiedFindings<F extends Fingerprinted> = {
  new: F[]
  known: F[]
  resolved: string[]
}
