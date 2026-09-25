import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ConfigError } from '@/config/ConfigError.js'
import { requirePostgresTarget } from '@/postgres/requirePostgresTarget.js'
import { resolvePostgresTarget } from '@/postgres/resolvePostgresTarget.js'

const pooler =
  'postgresql://postgres.abc@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'

describe('resolvePostgresTarget', () => {
  afterEach(() => {
    delete process.env['SUPABASE_DB_PASSWORD']
  })
  it('prefers --db-url, keeps only the host name, and moves the password out of the url', () => {
    expect(
      resolvePostgresTarget('/p', {
        'db-url': 'postgres://u:s%40c%2Fret@db.example.com:5432/d',
      }),
    ).toEqual({
      url: 'postgres://u@db.example.com:5432/d',
      host: 'db.example.com',
      password: 's@c/ret',
    })
    expect(
      resolvePostgresTarget('/p', { 'db-url': 'postgres://u@h/d' }),
    ).toEqual({ url: 'postgres://u@h/d', host: 'h' })
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
  it('refuses a transaction pooler: the read-only SET could land on another backend', () => {
    for (const url of [
      'postgres://u@pooler.example.com:6543/d',
      'postgres://u@h:5432/d?pgbouncer=true',
    ])
      expect(() => resolvePostgresTarget('/p', { 'db-url': url })).toThrow(
        /transaction pooler.*session pooler \(port 5432\)/,
      )
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(
      join(root, 'supabase/.temp/pooler-url'),
      pooler.replace(':5432', ':6543'),
    )
    process.env['SUPABASE_DB_PASSWORD'] = 'pw'
    expect(() => resolvePostgresTarget(root, {})).toThrow(ConfigError)
  })
  it('turns an unparsable linked pooler url into a ConfigError', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/pooler-url'), 'not a url\n')
    process.env['SUPABASE_DB_PASSWORD'] = 'pw'
    expect(() => resolvePostgresTarget(root, {})).toThrow(ConfigError)
    expect(() => resolvePostgresTarget(root, {})).toThrow(
      /supabase\/.temp\/pooler-url is not a valid url/,
    )
  })
  it('moves a ?password= parameter out of the url too', () => {
    expect(
      resolvePostgresTarget('/p', {
        'db-url': 'postgres://u@h:5432/d?password=se%20cret&sslmode=require',
      }),
    ).toEqual({
      url: 'postgres://u@h:5432/d?sslmode=require',
      host: 'h',
      password: 'se cret',
    })
  })
  it('turns a malformed percent-escape in the password into a ConfigError', () => {
    expect(() =>
      resolvePostgresTarget('/p', { 'db-url': 'postgres://u:%E0%A4%A@h/d' }),
    ).toThrow(ConfigError)
    expect(() =>
      resolvePostgresTarget('/p', { 'db-url': 'postgres://u:%E0%A4%A@h/d' }),
    ).toThrow(/--db-url password is not valid percent-encoding/)
  })
})
