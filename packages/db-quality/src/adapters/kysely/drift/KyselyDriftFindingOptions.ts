import type { DisableEntry } from '@/config/DisableEntry.js'
import type { Severity } from '@/model/Severity.js'

/** Everything needed to build (or suppress) one `BDB330/<rule>` finding. */
export type KyselyDriftFindingOptions = {
  rule: string
  severity: Severity
  path: string
  line: number
  message: string
  subject: string
  disabled: DisableEntry[]
}
