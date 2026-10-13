import { execFileSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

import { shellQuoted } from '@/report/shellQuoted.js'

describe('shellQuoted', () => {
  it('passes a hostile route to the shell as one literal argument', () => {
    const route = `/x';touch /tmp/pwned;echo '$(id)\`id\``
    const echoed = execFileSync(
      'sh',
      ['-c', `printf %s ${shellQuoted(route)}`],
      {
        encoding: 'utf8',
      },
    )
    expect(echoed).toBe(route)
  })
})
