import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { definerWithoutSearchPath } from '@/rules/definerWithoutSearchPath.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

describe('definerWithoutSearchPath', () => {
  it('flags the definer function that does not pin search_path', () => {
    const set = migrationSetFrom({
      'm.sql': readFileSync(
        new URL('../fixtures/migrations/definer.sql', import.meta.url),
        'utf8',
      ),
    })
    expect(
      definerWithoutSearchPath.run(set).map((f) => [f.line, f.subject]),
    ).toEqual([[2, 'public.unsafe']])
  })
})
