import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { migrationHashes } from '@/adapters/kysely/migrationHashes.js'
import { readKyselyHashFile } from '@/adapters/kysely/readKyselyHashFile.js'
import { editedFindings } from '@/adapters/kysely/rules/editedFindings.js'
import { updatedHashFile } from '@/adapters/kysely/updatedHashFile.js'
import { writeKyselyHashFile } from '@/adapters/kysely/writeKyselyHashFile.js'
import { locatedFixture } from '@tests/adapters/kysely/locatedFixture.js'

const v1 = locatedFixture('b_account', {
  postgres: ['create table "a" ("id" bigint)'],
})
const v2 = locatedFixture('b_account', {
  postgres: ['create table "a" ("id" text)'],
})
const other = locatedFixture('a_other', { postgres: ['select 1'] })

describe('the Kysely hash file', () => {
  it('records new migrations, refuses an edit, accepts a named one', () => {
    const first = updatedHashFile(undefined, [v1], [])
    expect(first.migrations['b_account']).toEqual(migrationHashes(v1))
    expect(updatedHashFile(first, [v1, other], []).migrations).toEqual({
      b_account: migrationHashes(v1),
      a_other: migrationHashes(other),
    })
    expect(() => updatedHashFile(first, [v2], [])).toThrow(
      /edited: b_account; restore them and add a new migration, or pass --accept-edit b_account/,
    )
    expect(updatedHashFile(first, [v2], ['b_account']).migrations).toEqual({
      b_account: migrationHashes(v2),
    })
    expect(() => updatedHashFile(first, [v1], ['nope'])).toThrow(
      /--accept-edit names no migration: nope/,
    )
  })
  it('adds a newly configured dialect to a released migration without calling it an edit', () => {
    const both = locatedFixture('b_account', {
      postgres: ['create table "a" ("id" bigint)'],
      sqlite: ['create table "a" ("id" bigint)'],
    })
    const next = updatedHashFile(
      updatedHashFile(undefined, [v1], []),
      [both],
      [],
    )
    expect(Object.keys(next.migrations['b_account'] ?? {}).sort()).toEqual([
      'postgres',
      'sqlite',
    ])
    expect(editedFindings([both], next, [])).toEqual([])
  })
  it('migration-edited fires only on a released migration whose SQL changed', () => {
    const released = updatedHashFile(undefined, [v1], [])
    expect(editedFindings([v1, other], released, [])).toEqual([])
    expect(editedFindings([v2], undefined, [])).toEqual([])
    expect(editedFindings([v2], released, []).map((f) => f.code)).toEqual([
      'BDB320/migration-edited',
    ])
  })
  it('writes sorted JSON and reads it back; a broken file is a configuration error', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(readKyselyHashFile(root)).toBeUndefined()
    const file = updatedHashFile(undefined, [v1, other], [])
    writeKyselyHashFile(root, file)
    const text = readFileSync(join(root, '.codeality-db-kysely.json'), 'utf8')
    expect(text.indexOf('a_other')).toBeLessThan(text.indexOf('b_account'))
    expect(readKyselyHashFile(root)).toEqual(file)
    writeFileSync(
      join(root, '.codeality-db-kysely.json'),
      '{"schemaVersion":1}',
    )
    expect(() => readKyselyHashFile(root)).toThrow(
      /is not valid: no migrations/,
    )
  })
})
