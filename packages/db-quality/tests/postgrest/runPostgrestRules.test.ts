import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runPostgrestRules } from '@/postgrest/runPostgrestRules.js'
import type { TableKnowledge } from '@/rules/TableKnowledge.js'

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../fixtures/postgrest/${name}`, import.meta.url),
    'utf8',
  )

const knowledge = new Map<string, TableKnowledge>([
  ['public.orders', { indexed: new Set(['id']), unique: new Set(['id']) }],
])

const codeCounts = (codes: string[]): Record<string, number> =>
  codes.reduce<Record<string, number>>((counts, code) => {
    counts[code] = (counts[code] ?? 0) + 1
    return counts
  }, {})

describe('runPostgrestRules', () => {
  it('runs every rule over every chain under the configured roots', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-postgrest-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src/chains.ts'), fixture('chains.ts'))
    writeFileSync(join(root, 'src/loops.tsx'), fixture('loops.tsx'))
    const findings = runPostgrestRules(root, ['src'], knowledge, [])
    expect(codeCounts(findings.map((f) => f.code))).toEqual({
      BDB801: 1,
      BDB802: 1,
      BDB803: 1,
      BDB804: 2,
    })
    const bySubject = new Map(findings.map((f) => [f.code, f.subject]))
    expect(bySubject.get('BDB801')).toBe('orders')
    expect(bySubject.get('BDB803')).toBe('orders.status')
  })
})
