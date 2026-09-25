import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { tableWithoutRls } from '@/rules/tableWithoutRls.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

const read = (name: string): string =>
  readFileSync(
    new URL(`../fixtures/migrations/${name}`, import.meta.url),
    'utf8',
  )

describe('tableWithoutRls', () => {
  it('reports only public tables never enabled in any migration', () => {
    const onlyA = migrationSetFrom({ 'm/a.sql': read('rls_set_a.sql') })
    expect(tableWithoutRls.run(onlyA).map((f) => f.subject)).toEqual([
      'public.naked',
    ])
    const both = migrationSetFrom({
      'm/a.sql': read('rls_set_a.sql'),
      'm/b.sql': read('rls_set_b.sql'),
    })
    expect(tableWithoutRls.run(both)).toEqual([])
  })
})
