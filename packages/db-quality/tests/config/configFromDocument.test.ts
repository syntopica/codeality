import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { configFromDocument } from '@/config/configFromDocument.js'

describe('configFromDocument', () => {
  it('fills the defaults', () => {
    expect(
      configFromDocument({
        schemaVersion: 1,
        supabase: { migrations: 'supabase/migrations' },
      }),
    ).toEqual({
      schemaVersion: 1,
      supabase: { migrations: 'supabase/migrations' },
      audit: { inGate: true, bloatThreshold: 5 },
      disable: [],
    })
  })
  it('keeps every section it is given', () => {
    const config = configFromDocument({
      schemaVersion: 1,
      prisma: { schema: 'p.prisma' },
      drizzle: { roots: ['src'] },
      sqlite: { files: ['a.db'] },
      audit: { inGate: false, bloatThreshold: 2, soda: 'db-quality/soda' },
      disable: ['BDB001'],
    })
    expect(config.drizzle).toEqual({
      roots: ['src'],
      objectNames: ['db', 'tx'],
    })
    expect(config.audit).toEqual({
      inGate: false,
      bloatThreshold: 2,
      soda: 'db-quality/soda',
    })
    expect(config.disable).toEqual(['BDB001'])
  })
  it.each([
    [{}, /schemaVersion/],
    [{ schemaVersion: 2 }, /schemaVersion/],
    [[], /must be an object/],
    [{ schemaVersion: 1, extra: true }, /unknown key "extra"/],
    [{ schemaVersion: 1, supabase: 'x' }, /supabase must be an object/],
    [{ schemaVersion: 1, supabase: { migrations: 3 } }, /supabase.migrations/],
    [{ schemaVersion: 1, prisma: { schema: 3 } }, /prisma.schema/],
    [{ schemaVersion: 1, drizzle: { roots: 'src' } }, /drizzle.roots/],
    [
      { schemaVersion: 1, drizzle: { roots: ['src'], objectNames: 'db' } },
      /drizzle.objectNames/,
    ],
    [{ schemaVersion: 1, sqlite: { files: 'a.db' } }, /sqlite.files/],
    [{ schemaVersion: 1, audit: { inGate: 'yes' } }, /audit.inGate/],
    [
      { schemaVersion: 1, audit: { bloatThreshold: '5' } },
      /audit.bloatThreshold/,
    ],
    [{ schemaVersion: 1, audit: { soda: 5 } }, /audit.soda/],
    [{ schemaVersion: 1, disable: [1] }, /disable/],
  ])('rejects %j', (document, message) => {
    expect(() => configFromDocument(document)).toThrow(ConfigError)
    expect(() => configFromDocument(document)).toThrow(message)
  })
})
