import type { KyselyDialect } from '@/config/KyselyDialect.js'

/** Released migrations: name to the SHA-256 of what each compiles to, per dialect. */
export type KyselyHashFile = {
  schemaVersion: 1
  migrations: Record<string, Partial<Record<KyselyDialect, string>>>
}
