import { describe, expect, it } from 'vitest'

import { classifyFindings } from '../src/classifyFindings.js'

const baseline = (entries: string[]) => ({
  schemaVersion: 1 as const,
  toolVersion: '1',
  entries,
})

// Adversarial cases: ways a baselined project can get worse. Each one either
// fails the gate or is pinned here as a known gap.
describe('classifyFindings worsening', () => {
  it('reports each extra occurrence of a baselined fingerprint as new', () => {
    const classified = classifyFindings(
      [{ fingerprint: 'a' }, { fingerprint: 'a' }, { fingerprint: 'a' }],
      baseline(['a', 'a']),
    )
    expect(classified.known).toHaveLength(2)
    expect(classified.new).toEqual([{ fingerprint: 'a' }])
    expect(classified.resolved).toEqual([])
  })

  it('reports each fixed occurrence as resolved', () => {
    const classified = classifyFindings(
      [{ fingerprint: 'a' }],
      baseline(['a', 'a', 'b']),
    )
    expect(classified.new).toEqual([])
    expect(classified.resolved).toEqual(['a', 'b'])
  })

  it('cannot trade a fixed defect for a new one with the same count', () => {
    const classified = classifyFindings(
      [{ fingerprint: 'a' }, { fingerprint: 'c' }],
      baseline(['a', 'b']),
    )
    expect(classified.new).toEqual([{ fingerprint: 'c' }])
  })

  // Without a measurement policy the count is all that is compared: a
  // fingerprint excludes the measured value on purpose, so a finding that grows
  // stays known. The policy cases are in classifyFindings.measurements.test.ts.
  it('does not see a grown value without a measurement policy', () => {
    const before = { fingerprint: 'max-lines|src/a.ts', observed: 120 }
    const after = { ...before, observed: 400 }
    expect(
      classifyFindings([after], baseline([before.fingerprint])).new,
    ).toEqual([])
  })
})
