import type { Finding } from '@/model/Finding.js'
import type { Severity } from '@/model/Severity.js'
import type { MigrationFile } from '@/sql/MigrationFile.js'

export type SqlRule = {
  code: string
  name: string
  severity: Severity
  run: (set: MigrationFile[]) => Finding[]
}
