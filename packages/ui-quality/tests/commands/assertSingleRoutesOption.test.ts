import { describe, expect, it } from 'vitest'

import { assertSingleRoutesOption } from '@/commands/assertSingleRoutesOption.js'

describe('assertSingleRoutesOption', () => {
  it.each([
    [],
    ['--json'],
    ['--routes', '/one', '--json'],
    ['--routes=/one?value=--routes'],
    ['--routes', '/one', '--', '--routes', '/two'],
    ['--', '--routes', '/one', '--routes', '/two'],
  ])('accepts a single option or literal positionals: %j', (...argv) => {
    expect(() => {
      assertSingleRoutesOption(argv)
    }).not.toThrow()
  })
})
