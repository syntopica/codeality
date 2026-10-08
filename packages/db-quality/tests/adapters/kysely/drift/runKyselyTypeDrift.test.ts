import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { runKyselyTypeDrift } from '@/adapters/kysely/drift/runKyselyTypeDrift.js'
import type { KyselyConfig } from '@/config/KyselyConfig.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const PACKAGE_ROOT = join(__dirname, '..', '..', '..', '..')
const DB_URL = 'postgresql://u:p@localhost:5432/d'

let root: string

const runnerWriting =
  (dbTypes: string): CommandRunner =>
  (command, args, options) => {
    if (command !== 'npx')
      return { status: 0, stdout: '', stderr: '', missing: false }
    const outFileIndex = args.indexOf('--out-file')
    const outFile = args[outFileIndex + 1]
    if (outFile === undefined) throw new Error('missing --out-file')
    expect(options.env?.['CODEALITY_DB_URL']).toBe(DB_URL)
    expect(args.join(' ')).not.toContain(DB_URL)

    writeFileSync(outFile, dbTypes)
    return { status: 0, stdout: '', stderr: '', missing: false }
  }

const kyselyConfig = (overrides: Partial<KyselyConfig> = {}): KyselyConfig => ({
  roots: ['src'],
  objectNames: ['db', 'trx'],
  databaseType: 'src/db/Database.ts#Database',
  databaseTypeIgnores: [],
  ...overrides,
})

const DB_D_TS = `
import type { ColumnType } from "kysely"
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>
export interface Event {
  id: string
  name: string
  created_at: Timestamp
}
export interface DB {
  event: Event
}
`

const HAND_TYPE = `
export type EventTable = {
  id: string
  name: string
  created_at: Date | string
}
export type Database = {
  event: EventTable
}
`

beforeEach(() => {
  root = mkdtempSync(join(PACKAGE_ROOT, 'tests', '.tmp-drift-'))
  writeFileSync(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        module: 'nodenext',
        moduleResolution: 'nodenext',
        target: 'es2022',
        skipLibCheck: true,
      },
    }),
  )
  writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module' }))
  mkdirSync(join(root, 'src', 'db'), { recursive: true })
  writeFileSync(join(root, 'src', 'db', 'Database.ts'), HAND_TYPE)
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('runKyselyTypeDrift', () => {
  it('reports nothing when the live and declared schemas match', () => {
    const findings = runKyselyTypeDrift({
      runner: runnerWriting(DB_D_TS),
      root,
      kysely: kyselyConfig(),
      dbUrl: DB_URL,
      disabled: [],
    })
    expect(findings).toEqual([])
  })

  it('reports column-type-drift when a live column is nullable but declared non-null', () => {
    const dbTypes = DB_D_TS.replace('name: string', 'name: string | null')
    const findings = runKyselyTypeDrift({
      runner: runnerWriting(dbTypes),
      root,
      kysely: kyselyConfig(),
      dbUrl: DB_URL,
      disabled: [],
    })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      code: 'BDB330/column-type-drift',
      subject: 'event.name',
    })
  })

  it('reports table-missing-in-type for a live table absent from the declared type', () => {
    const dbTypes = DB_D_TS.replace(
      'export interface DB {\n  event: Event\n}',
      'export interface Session {\n  id: string\n}\nexport interface DB {\n  event: Event\n  session: Session\n}',
    )
    const findings = runKyselyTypeDrift({
      runner: runnerWriting(dbTypes),
      root,
      kysely: kyselyConfig(),
      dbUrl: DB_URL,
      disabled: [],
    })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      code: 'BDB330/table-missing-in-type',
      subject: 'session',
    })
  })

  it('does not report an ignored table', () => {
    const dbTypes = DB_D_TS.replace(
      'export interface DB {\n  event: Event\n}',
      'export interface Session {\n  id: string\n}\nexport interface DB {\n  event: Event\n  session: Session\n}',
    )
    const findings = runKyselyTypeDrift({
      runner: runnerWriting(dbTypes),
      root,
      kysely: kyselyConfig({ databaseTypeIgnores: ['session'] }),
      dbUrl: DB_URL,
      disabled: [],
    })
    expect(findings).toEqual([])
  })

  it('reports column-missing-in-database for a declared column absent live', () => {
    writeFileSync(
      join(root, 'src', 'db', 'Database.ts'),
      HAND_TYPE.replace(
        'created_at: Date | string',
        'created_at: Date | string\n  extra: string',
      ),
    )
    const findings = runKyselyTypeDrift({
      runner: runnerWriting(DB_D_TS),
      root,
      kysely: kyselyConfig(),
      dbUrl: DB_URL,
      disabled: [],
    })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      code: 'BDB330/column-missing-in-database',
      subject: 'event.extra',
    })
  })
})
