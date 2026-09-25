import { describe, expect, it } from 'vitest'

import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import { perfSectionFrom } from '@/config/perfSectionFrom.js'

describe('perfSectionFrom', () => {
  it('fills every default when the section is absent', () => {
    expect(perfSectionFrom(undefined)).toEqual(PERF_DEFAULTS)
  })
  it('overrides one key and keeps the rest', () => {
    expect(perfSectionFrom({ slowMs: 250, inGate: false })).toEqual({
      ...PERF_DEFAULTS,
      slowMs: 250,
      inGate: false,
    })
  })
  it('rejects a role name that is not an identifier', () => {
    expect(() => perfSectionFrom({ roles: ['postgres; drop'] })).toThrow(
      /perf.roles entries must match/,
    )
  })
  it('rejects wrong types', () => {
    expect(() => perfSectionFrom({ minCalls: '20' })).toThrow(
      /perf.minCalls must be a number/,
    )
    expect(() => perfSectionFrom({ ignore: [1] })).toThrow(
      /perf.ignore must be a list of strings/,
    )
    expect(() => perfSectionFrom({ benchDir: 3 })).toThrow(
      /perf.benchDir must be a string/,
    )
  })
  it('requires positive integers for the counts and the timeout, and at least one role', () => {
    for (const key of ['benchRuns', 'minCalls', 'benchTimeoutMs'])
      for (const value of [0, -1, 1.5])
        expect(() => perfSectionFrom({ [key]: value })).toThrow(
          `perf.${key} must be a positive integer`,
        )
    expect(() => perfSectionFrom({ roles: [] })).toThrow(
      /perf.roles must name at least one role/,
    )
  })
})
