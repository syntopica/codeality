import type { CheckProbeLineSet } from '@/adapters/kysely/drift/CheckProbeLineSet.js'
import type { SharedColumn } from '@/adapters/kysely/drift/SharedColumn.js'
import type { WriteDriftCheckProbeOptions } from '@/adapters/kysely/drift/WriteDriftCheckProbeOptions.js'

// Builds the check probe's source: one import header, then one line per
// shared column forcing the compiler to check its live SELECT type against
// the declared one, plus the live and declared type strings alongside for
// the eventual message.
export const checkProbeLines = ({
  live,
  declared,
}: WriteDriftCheckProbeOptions): CheckProbeLineSet => {
  const sharedColumns: SharedColumn[] = []
  const lines = [
    `import type { Live, Declared } from './probe.js'`,
    `import type { SelectType } from 'kysely'`,
    `type Check<Declared, _Live extends Declared> = true`,
  ]
  let index = 0
  for (const [table, entry] of declared) {
    const liveColumns = live.get(table)
    if (liveColumns === undefined) continue
    for (const column of entry.columns.keys()) {
      if (!liveColumns.has(column)) continue
      const t = JSON.stringify(table)
      const c = JSON.stringify(column)
      lines.push(
        `export type C${String(index)} = Check<SelectType<Declared[${t}][${c}]>, SelectType<Live[${t}][${c}]>>`,
        `export type L${String(index)} = SelectType<Live[${t}][${c}]>`,
        `export type D${String(index)} = SelectType<Declared[${t}][${c}]>`,
      )
      sharedColumns.push({ table, column, index })
      index += 1
    }
  }
  return { lines, sharedColumns }
}
