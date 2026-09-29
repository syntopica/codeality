import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { sqliteSectionFrom } from '@/config/sqliteSectionFrom.js'

describe('sqliteSectionFrom', () => {
  it('keeps a files-only section as it was', () => {
    expect(sqliteSectionFrom({ files: ['a.db'] })).toEqual({ files: ['a.db'] })
  })
  it('fills the minRows default of a queries section', () => {
    expect(
      configFromDocument({
        schemaVersion: 2,
        sqlite: { files: [], queries: { paths: ['sql'] } },
      }).sqlite,
    ).toEqual({ files: [], queries: { paths: ['sql'], minRows: 10000 } })
  })
  it('keeps the database and a given minRows', () => {
    expect(
      sqliteSectionFrom({
        files: [],
        queries: { paths: ['sql'], database: '~/dev.db', minRows: 50 },
      }).queries,
    ).toEqual({ paths: ['sql'], database: '~/dev.db', minRows: 50 })
  })
  it.each([
    [{ files: 'a.db' }, /sqlite.files must be a list of strings/],
    [{ files: [], queries: [] }, /sqlite.queries must be an object/],
    [{ files: [], queries: {} }, /sqlite.queries.paths must be a list/],
    [
      { files: [], queries: { paths: [] } },
      /sqlite.queries.paths must name at least one directory/,
    ],
    [
      { files: [], queries: { paths: ['sql'], database: 3 } },
      /sqlite.queries.database must be a string/,
    ],
    [
      { files: [], queries: { paths: ['sql'], minRows: 0 } },
      /sqlite.queries.minRows must be a positive integer/,
    ],
  ])('refuses %j', (raw, message) => {
    expect(() => sqliteSectionFrom(raw)).toThrow(ConfigError)
    expect(() => sqliteSectionFrom(raw)).toThrow(message)
  })
})
