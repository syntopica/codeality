import { describe, expect, it } from 'vitest'

import { rangeFloor } from '../bin/conformance/rangeFloor.mjs'

describe('rangeFloor', () => {
  it('reads the floor out of every range form in use', () => {
    expect(rangeFloor('^0.7.3')).toEqual([0, 7, 3])
    expect(rangeFloor('~1.2.0')).toEqual([1, 2, 0])
    expect(rangeFloor('>=2.0.0')).toEqual([2, 0, 0])
    expect(rangeFloor('0.2.1')).toEqual([0, 2, 1])
  })

  it('follows an npm: alias to the version it points at', () => {
    expect(rangeFloor('npm:@typescript/typescript6@^6.0.2')).toEqual([6, 0, 2])
  })

  it('returns null for a range with no version to compare', () => {
    expect(rangeFloor('workspace:*')).toBeNull()
    expect(rangeFloor('*')).toBeNull()
    expect(rangeFloor('latest')).toBeNull()
    expect(rangeFloor(undefined)).toBeNull()
  })
})
