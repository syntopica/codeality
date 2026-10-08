import { describe, expect, it } from 'vitest'

import { compareSchemas } from '@/adapters/kysely/drift/compareSchemas.js'
import type { DeclaredSchema } from '@/adapters/kysely/drift/DeclaredSchema.js'
import type { LiveSchema } from '@/adapters/kysely/drift/LiveSchema.js'

const property = { path: 'src/db/Database.ts', line: 10 }

describe('compareSchemas', () => {
  it('finds nothing when live and declared match', () => {
    const live: LiveSchema = new Map([['event', new Set(['id', 'name'])]])
    const declared: DeclaredSchema = new Map([
      [
        'event',
        {
          property,
          columns: new Map([
            ['id', property],
            ['name', property],
          ]),
        },
      ],
    ])
    expect(compareSchemas(live, declared, [], [])).toEqual({
      tableMissingInType: [],
      tableMissingInDatabase: [],
      columnMissingInType: [],
      columnMissingInDatabase: [],
      columnTypeDrift: [],
    })
  })

  it('reports a live table missing from the declared type', () => {
    const live: LiveSchema = new Map([
      ['event', new Set(['id'])],
      ['session', new Set(['id'])],
    ])
    const declared: DeclaredSchema = new Map([
      ['event', { property, columns: new Map([['id', property]]) }],
    ])
    const result = compareSchemas(live, declared, [], [])
    expect(result.tableMissingInType).toEqual(['session'])
  })

  it('ignores a table listed in databaseTypeIgnores', () => {
    const live: LiveSchema = new Map([['session', new Set(['id'])]])
    const declared: DeclaredSchema = new Map()
    const result = compareSchemas(live, declared, ['session'], [])
    expect(result.tableMissingInType).toEqual([])
  })

  it('reports a declared table missing from the database', () => {
    const live: LiveSchema = new Map()
    const declared: DeclaredSchema = new Map([
      ['event', { property, columns: new Map([['id', property]]) }],
    ])
    const result = compareSchemas(live, declared, [], [])
    expect(result.tableMissingInDatabase).toEqual([
      { table: 'event', property },
    ])
  })

  it('reports a live column missing from the declared type', () => {
    const live: LiveSchema = new Map([['event', new Set(['id', 'name'])]])
    const declared: DeclaredSchema = new Map([
      ['event', { property, columns: new Map([['id', property]]) }],
    ])
    const result = compareSchemas(live, declared, [], [])
    expect(result.columnMissingInType).toEqual([
      { table: 'event', column: 'name', property },
    ])
  })

  it('reports a declared column missing from the database', () => {
    const live: LiveSchema = new Map([['event', new Set(['id'])]])
    const declared: DeclaredSchema = new Map([
      [
        'event',
        {
          property,
          columns: new Map([
            ['id', property],
            ['name', property],
          ]),
        },
      ],
    ])
    const result = compareSchemas(live, declared, [], [])
    expect(result.columnMissingInDatabase).toEqual([
      { table: 'event', column: 'name', property },
    ])
  })

  it('passes through pre-computed column type drifts unchanged', () => {
    const drift = {
      table: 'event',
      column: 'id',
      property,
      liveType: 'string',
      declaredType: 'number',
    }
    const result = compareSchemas(new Map(), new Map(), [], [drift])
    expect(result.columnTypeDrift).toEqual([drift])
  })
})
