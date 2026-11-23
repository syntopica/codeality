import { loadavg } from 'node:os'

/** The machine's 1-minute load average; 0 on Windows, which has none. */
export const readLoadAverage = (): number => loadavg()[0] ?? 0
