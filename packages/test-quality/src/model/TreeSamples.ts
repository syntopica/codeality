/** What a sampler recorded about a process tree, one entry per sample. */
export type TreeSamples = {
  /** Resident memory of the root and every descendant, in MB. */
  rssMb: number[]
  /** Processes under the root per sample, not counting it. */
  descendants: number[]
}
