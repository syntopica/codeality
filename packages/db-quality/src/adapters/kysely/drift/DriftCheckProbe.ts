import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'

/** The check probe's file path and the shared columns it declared lines for. */
export type DriftCheckProbe = {
  checkFile: string
  sharedColumns: SharedColumn[]
}
