/** The machine a run shared: logical CPUs and its 1-minute load around the run. */
export type HostLoad = {
  cpus: number
  loadBefore: number
  loadAfter: number
}
