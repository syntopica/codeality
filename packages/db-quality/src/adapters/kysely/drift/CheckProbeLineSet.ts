import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'

/** The check probe's source lines and the shared columns they declare, before writing. */
export type CheckProbeLineSet = {
  lines: string[]
  sharedColumns: SharedColumn[]
}
