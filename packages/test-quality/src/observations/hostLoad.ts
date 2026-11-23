import type { HostLoad } from '@/model/HostLoad.js'
import type { Observation } from '@/model/Observation.js'

/**
 * The load the run shared the machine with. Two timings are comparable only
 * at similar load on the same CPU count.
 */
export const hostLoad = (host: HostLoad): Observation => ({
  name: 'host-load',
  message: `1-minute load ${host.loadBefore.toFixed(2)} before and ${host.loadAfter.toFixed(2)} after the run, on ${String(host.cpus)} CPUs; compare runs only at similar load`,
  evidence: [],
})
