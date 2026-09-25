import { describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'

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
      perf: PERF_DEFAULTS,
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
      postgrest: { roots: ['src'] },
      perf: { slowMs: 250 },
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
    expect(config.postgrest).toEqual({ roots: ['src'] })
    expect(config.perf).toEqual({ ...PERF_DEFAULTS, slowMs: 250 })
    expect(config.disable).toEqual([
      { code: 'BDB001', reason: LEGACY_DISABLE_REASON },
    ])
  })
  it('reads schemaVersion 2 with object disable entries', () => {
    const config = configFromDocument({
      schemaVersion: 2,
      disable: [{ code: 'BDB001', reason: 'r' }],
    })
    expect(config.schemaVersion).toBe(2)
    expect(config.disable).toEqual([{ code: 'BDB001', reason: 'r' }])
  })
  it('still reads schemaVersion 1 with string entries', () => {
    expect(
      configFromDocument({ schemaVersion: 1, disable: ['BDB001'] }).disable[0]
        ?.code,
    ).toBe('BDB001')
  })
  it('rejects any other schemaVersion', () => {
    expect(() => configFromDocument({ schemaVersion: 3 })).toThrow(
      /schemaVersion must be 1 or 2/,
    )
  })
  it.each([
    [{}, /schemaVersion/],
    [{ schemaVersion: 3 }, /schemaVersion/],
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
    [{ schemaVersion: 1, postgrest: { roots: [] } }, /postgrest.roots/],
    [{ schemaVersion: 1, perf: { minCalls: '20' } }, /perf.minCalls/],
    [{ schemaVersion: 1, disable: [1] }, /disable/],
  ])('rejects %j', (document, message) => {
    expect(() => configFromDocument(document)).toThrow(ConfigError)
    expect(() => configFromDocument(document)).toThrow(message)
  })
})
