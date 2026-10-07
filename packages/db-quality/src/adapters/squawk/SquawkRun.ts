import type { DisableEntry } from '@/config/DisableEntry.js'

/** The rules squawk leaves out, and the codes the project disabled. */
export type SquawkRun = {
  excludes: readonly string[]
  disabled: DisableEntry[]
}
