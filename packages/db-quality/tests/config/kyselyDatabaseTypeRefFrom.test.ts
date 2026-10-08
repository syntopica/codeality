import { describe, expect, it } from 'vitest'

import { kyselyDatabaseTypeRefFrom } from '@/config/kyselyDatabaseTypeRefFrom.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

describe('kyselyDatabaseTypeRefFrom', () => {
  it('defaults the export name to Database when there is no #', () => {
    expect(kyselyDatabaseTypeRefFrom('src/db/Database.ts')).toEqual({
      path: 'src/db/Database.ts',
      exportName: 'Database',
    })
  })
  it('reads the export name after #', () => {
    expect(kyselyDatabaseTypeRefFrom('src/db/Database.ts#DB')).toEqual({
      path: 'src/db/Database.ts',
      exportName: 'DB',
    })
  })
  it.each([
    '#Database',
    'src/db/Database.ts#',
    '#',
    "src/db/x'.ts#Database",
    'src/db/Database.ts#Data base',
    'src/db/Database.ts#1Db',
  ])('rejects %j', (value) => {
    expect(() => kyselyDatabaseTypeRefFrom(value)).toThrow(ConfigError)
  })
})
