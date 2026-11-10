import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { kyselySectionFrom } from '@/config/kyselySectionFrom.js'

const MODULE = 'src/db/migrations/migrationList.ts'

describe('kyselySectionFrom', () => {
  it('fills the defaults: db and trx, the migrations export, moneyColumns off', () => {
    expect(kyselySectionFrom({ roots: ['src'] })).toEqual({
      roots: ['src'],
      objectNames: ['db', 'trx'],
    })
    expect(
      kyselySectionFrom({ roots: ['src'], migrations: { module: MODULE } }),
    ).toEqual({
      roots: ['src'],
      objectNames: ['db', 'trx'],
      migrations: { module: MODULE, export: 'migrations', moneyColumns: false },
    })
  })
  it('keeps every explicit value, including databaseType and databaseTypeIgnores', () => {
    expect(
      kyselySectionFrom({
        roots: ['src', 'server'],
        objectNames: ['conn'],
        databaseType: 'src/db/Database.ts#Database',
        databaseTypeIgnores: ['session'],
        migrations: {
          folder: 'migrations',
          export: 'ignored',
          dialects: ['mysql', 'sqlite'],
          moneyColumns: true,
        },
      }),
    ).toEqual({
      roots: ['src', 'server'],
      objectNames: ['conn'],
      databaseType: 'src/db/Database.ts#Database',
      databaseTypeIgnores: ['session'],
      migrations: {
        folder: 'migrations',
        export: 'ignored',
        dialects: ['mysql', 'sqlite'],
        moneyColumns: true,
      },
    })
  })
  it('keeps declared query responses, with their optional migration and step', () => {
    const queryResponses = [
      {
        match: 'information_schema.columns',
        migration: '0068_widen',
        step: 'up',
        rows: [{ data_type: 'timestamp' }],
      },
      { match: '@@session.sql_mode', rows: [{ mode: '' }] },
    ]
    expect(
      kyselySectionFrom({
        roots: ['src'],
        migrations: { module: MODULE, queryResponses },
      }).migrations?.queryResponses,
    ).toEqual(queryResponses)
  })
  it.each([
    [{}, /kysely.roots/],
    [{ roots: ['src'], objectNames: 'db' }, /kysely.objectNames/],
    [{ roots: ['src'], databaseType: 1 }, /kysely.databaseType/],
    [{ roots: ['src'], databaseType: '#Database' }, /invalid value/],
    [{ roots: ['src'], databaseType: 'src/db/Database.ts#' }, /invalid value/],
    [
      { roots: ['src'], databaseTypeIgnores: 'session' },
      /kysely.databaseTypeIgnores/,
    ],
    [{ roots: ['src'], migrations: [] }, /migrations must be an object/],
    [{ roots: ['src'], migrations: {} }, /exactly one of "module" or "folder"/],
    [
      { roots: ['src'], migrations: { module: MODULE, folder: 'm' } },
      /exactly one/,
    ],
    [
      { roots: ['src'], migrations: { module: MODULE, export: 1 } },
      /migrations.export/,
    ],
    [
      { roots: ['src'], migrations: { module: MODULE, moneyColumns: 'yes' } },
      /moneyColumns/,
    ],
    [
      { roots: ['src'], migrations: { module: MODULE, dialects: ['mssql'] } },
      /dialects must be a non-empty list of postgres, mysql, sqlite/,
    ],
    [
      { roots: ['src'], migrations: { module: MODULE, dialects: [] } },
      /dialects/,
    ],
    [
      { roots: ['src'], migrations: { module: MODULE, queryResponses: {} } },
      /queryResponses must be a list/,
    ],
    [
      {
        roots: ['src'],
        migrations: {
          module: MODULE,
          queryResponses: [{ match: '', rows: [] }],
        },
      },
      /queryResponses\[0\]\.match must be a non-empty string/,
    ],
    [
      {
        roots: ['src'],
        migrations: {
          module: MODULE,
          queryResponses: [{ match: 'x', rows: [1] }],
        },
      },
      /queryResponses\[0\]\.rows must be a list of objects/,
    ],
    [
      {
        roots: ['src'],
        migrations: {
          module: MODULE,
          queryResponses: [{ match: 'x', rows: [], step: 'both' }],
        },
      },
      /queryResponses\[0\]\.step must be "up" or "down"/,
    ],
    [
      {
        roots: ['src'],
        migrations: {
          module: MODULE,
          queryResponses: [{ match: 'x', rows: [], migration: 1 }],
        },
      },
      /queryResponses\[0\]\.migration must be a string/,
    ],
    [
      {
        roots: ['src'],
        migrations: { module: MODULE, queryResponses: [null] },
      },
      /queryResponses\[0\] must be an object/,
    ],
  ])('rejects %j', (raw, message) => {
    expect(() => kyselySectionFrom(raw)).toThrow(message)
  })
  it('is a known section of the configuration file', () => {
    expect(
      configFromDocument({ schemaVersion: 2, kysely: { roots: ['src'] } })
        .kysely,
    ).toEqual({
      roots: ['src'],
      objectNames: ['db', 'trx'],
    })
  })
})
