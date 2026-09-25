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
})
