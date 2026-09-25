import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { requirePostgresTarget } from '@/postgres/requirePostgresTarget.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'

const pooler =
  'postgresql://postgres.abc@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'

describe('resolvePostgresTarget', () => {
  afterEach(() => {
    delete process.env['SUPABASE_DB_PASSWORD']
  })
  it('prefers --db-url and keeps only the host name', () => {
    expect(
      resolvePostgresTarget('/p', {
        'db-url': 'postgres://u:secret@db.example.com:5432/d',
      }),
    ).toEqual({
      url: 'postgres://u:secret@db.example.com:5432/d',
      host: 'db.example.com',
    })
  })
  it('uses the linked pooler url with the password from the environment', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/pooler-url'), `${pooler}\n`)
    process.env['SUPABASE_DB_PASSWORD'] = 'pw'
    expect(resolvePostgresTarget(root, {})).toEqual({
      url: pooler,
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      password: 'pw',
    })
    delete process.env['SUPABASE_DB_PASSWORD']
    expect(resolvePostgresTarget(root, {})).toBeUndefined()
  })
  it('is undefined without a link, and requirePostgresTarget names both options', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(resolvePostgresTarget(root, {})).toBeUndefined()
    expect(() => requirePostgresTarget(root, {})).toThrow(
      /--db-url, or a linked project with SUPABASE_DB_PASSWORD/,
    )
  })
  it('rejects a --db-url that is not a url', () => {
    expect(() =>
      resolvePostgresTarget('/p', { 'db-url': 'not a url' }),
    ).toThrow(/--db-url is not a valid url/)
  })
})
