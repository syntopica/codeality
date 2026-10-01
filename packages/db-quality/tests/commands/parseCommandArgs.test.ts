import { describe, expect, it } from 'vitest'

import { ConfigError } from '@syntopica/gate-kit/ConfigError'
import { parseCommandArgs } from '@syntopica/gate-kit/parseCommandArgs'

describe('parseCommandArgs', () => {
  it('parses flags and positionals', () => {
    expect(
      parseCommandArgs(['--json', 'create'], { json: { type: 'boolean' } }),
    ).toEqual({
      values: { json: true },
      positionals: ['create'],
    })
  })
  it('turns an unknown flag into a ConfigError', () => {
    expect(() => parseCommandArgs(['--nope'], {})).toThrow(ConfigError)
  })
})
