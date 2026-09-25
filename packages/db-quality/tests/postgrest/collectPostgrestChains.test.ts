import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { collectPostgrestChains } from '@/postgrest/collectPostgrestChains.js'

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../fixtures/postgrest/${name}`, import.meta.url),
    'utf8',
  )

describe('collectPostgrestChains', () => {
  const chains = collectPostgrestChains('src/chains.ts', fixture('chains.ts'))
  it('finds every chain rooted at from or rpc with a literal target', () => {
    expect(chains.map((c) => [c.root, c.target])).toEqual([
      ['from', 'orders'],
      ['from', 'orders'],
      ['from', 'orders'],
      ['rpc', 'reap_jobs'],
      ['from', 'orders'],
    ])
  })
  it('records the calls after the root with their literal arguments', () => {
    expect(chains[1]?.calls).toEqual([
      { name: 'select', args: ['id, status', '{count:exact}'] },
      { name: 'eq', args: ['status', 'open'] },
      { name: 'order', args: ['created_at', '{ascending:false}'] },
      { name: 'limit', args: ['?'] },
    ])
  })
  it('points at the line of the from call and keeps the chain text', () => {
    expect(chains[0]?.line).toBe(7)
    expect(chains[0]?.text).toBe("supabase.from('orders').select('*')")
  })
  it('marks chains inside loops and iteration callbacks, not helpers', () => {
    const loops = collectPostgrestChains('src/loops.tsx', fixture('loops.tsx'))
    expect(loops.map((c) => c.inLoop)).toEqual([true, true, false])
  })
  it('skips a `.storage.from()` chain: Storage is not PostgREST', () => {
    const source = `
declare const supabase: { from: (t: string) => any, storage: { from: (b: string) => any } }
declare const files: string[]
export const upload = async () => {
  for (const file of files) {
    await supabase.storage.from('client-docs').uploadToSignedUrl(file, 'token', file)
  }
}
export const read = async () => supabase.from('table').select('id')
`
    const chains = collectPostgrestChains('src/storage.ts', source)
    expect(chains.map((c) => [c.root, c.target])).toEqual([['from', 'table']])
  })
  it('requires a literal target: `Array.from({ length })` is not a chain root', () => {
    const source = `
declare const supabase: { from: (t: string) => any, rpc: (f: string, a?: unknown) => any }
declare const rows: number
export const grid = () => {
  for (const n of Array.from({ length: rows }, (_, i) => i)) void n
}
export const read = async () => supabase.from('t').select('id')
export const call = async () => supabase.rpc('f', { a: 1 })
`
    const chains = collectPostgrestChains('src/arrayFrom.ts', source)
    expect(chains.map((c) => [c.root, c.target])).toEqual([
      ['from', 't'],
      ['rpc', 'f'],
    ])
  })
})
