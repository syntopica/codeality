import { describe, expect, it } from 'vitest'

import { parseCommandArgs } from '@/commands/parseCommandArgs.js'
import { ConfigError } from '@/config/ConfigError.js'

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
