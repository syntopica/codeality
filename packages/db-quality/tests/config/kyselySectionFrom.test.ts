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
