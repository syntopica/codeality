import { describe, expect, it } from 'vitest'

import { auditPlan } from '@/audit/auditPlan.js'
import { isSupabaseHost } from '@/audit/isSupabaseHost.js'
import { ConfigError } from '@/config/ConfigError.js'
import { configFromDocument } from '@/config/configFromDocument.js'

const plain = configFromDocument({ schemaVersion: 1 })
const withSoda = configFromDocument({
  schemaVersion: 1,
  audit: { soda: 'soda' },
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
      skipped: [],
    })
    expect(auditPlan(withSoda, { linked: true }).skipped).toEqual([
      'soda: skipped, a linked target carries no database password; pass --db-url',
    ])
  })
  it('runs Soda alone against a plain Postgres and everything against a Supabase URL', () => {
    const local = auditPlan(withSoda, { dbUrl: 'postgresql://me@localhost/db' })
    expect(local).toMatchObject({ supabase: false, soda: true })
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
      skipped: [],
    })
  })
  it('refuses a target nothing can audit', () => {
    expect(() =>
      auditPlan(plain, { dbUrl: 'postgresql://me@localhost/db' }),
    ).toThrow(ConfigError)
  })
})
