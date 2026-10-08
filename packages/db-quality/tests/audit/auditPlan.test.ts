import { describe, expect, it } from 'vitest'

import { auditPlan } from '@/audit/auditPlan.js'
import { isSupabaseHost } from '@/audit/isSupabaseHost.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

const LOCALHOST_DB_URL = 'postgresql://me@localhost/db'

const plain = configFromDocument({ schemaVersion: 1 })
const withSoda = configFromDocument({
  schemaVersion: 1,
  audit: { soda: 'soda' },
})
const withKysely = configFromDocument({
  schemaVersion: 1,
  kysely: { roots: ['src'], databaseType: 'src/db/Database.ts' },
})

describe('isSupabaseHost', () => {
  it.each([
    ['postgresql://postgres:p@db.abcdefgh.supabase.co:5432/postgres', true],
    [
      'postgresql://u:p@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
      true,
    ],
    ['postgresql://me@localhost:5432/taxhacker', false],
    ['not a url', false],
  ])('%s -> %s', (url, expected) => {
    expect(isSupabaseHost(url)).toBe(expected)
  })
})

describe('auditPlan', () => {
  it('runs the Supabase adapters for a linked target and says Soda is skipped', () => {
    expect(auditPlan(plain, { linked: true })).toEqual({
      supabase: true,
      soda: false,
      kysely: false,
      skipped: [],
    })
    expect(auditPlan(withSoda, { linked: true }).skipped).toEqual([
      'soda: skipped, a linked target carries no database password; pass --db-url',
    ])
  })
  it('runs Soda alone against a plain Postgres and everything against a Supabase URL', () => {
    const local = auditPlan(withSoda, { dbUrl: LOCALHOST_DB_URL })
    expect(local).toMatchObject({ supabase: false, soda: true, kysely: false })
    expect(local.skipped).toEqual([
      'supabase: skipped, --db-url is not a Supabase project host',
    ])
    expect(
      auditPlan(withSoda, {
        dbUrl: 'postgresql://u:p@db.x.supabase.co/postgres',
      }),
    ).toEqual({
      supabase: true,
      soda: true,
      kysely: false,
      skipped: [],
    })
  })
  it('runs the Kysely type drift audit when databaseType is set and the URL supports it', () => {
    const result = auditPlan(withKysely, {
      dbUrl: LOCALHOST_DB_URL,
    })
    expect(result).toMatchObject({ kysely: true })
    expect(result.skipped).toEqual([
      'supabase: skipped, --db-url is not a Supabase project host',
    ])
  })
  it('skips Kysely for a linked target', () => {
    expect(auditPlan(withKysely, { linked: true }).skipped).toContain(
      'kysely type drift: skipped, a linked target carries no database URL; pass --db-url',
    )
  })
  it('skips Kysely for an unsupported URL scheme', () => {
    expect(() =>
      auditPlan(withKysely, { dbUrl: 'mongodb://me@localhost/db' }),
    ).toThrow(/no Kysely type drift can run/)
    const both = configFromDocument({
      schemaVersion: 1,
      audit: { soda: 'soda' },
      kysely: { roots: ['src'], databaseType: 'src/db/Database.ts' },
    })
    expect(
      auditPlan(both, { dbUrl: 'mongodb://me@localhost/db' }).skipped,
    ).toContain(
      'kysely type drift: skipped, mongodb is not a postgres or mysql URL',
    )
  })
  it('refuses a target nothing can audit', () => {
    expect(() => auditPlan(plain, { dbUrl: LOCALHOST_DB_URL })).toThrow(
      /nothing to audit: not a Supabase host, audit\.soda is not configured and no Kysely type drift can run/,
    )
    expect(() => auditPlan(plain, { dbUrl: LOCALHOST_DB_URL })).toThrow(
      ConfigError,
    )
  })
})
