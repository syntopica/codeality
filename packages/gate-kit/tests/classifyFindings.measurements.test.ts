import { describe, expect, it } from 'vitest'

import type { BaselineFile } from '../src/BaselineFile.js'
import type { BaselineMeasurement } from '../src/BaselineMeasurement.js'
import { classifyFindings } from '../src/classifyFindings.js'
import type { MeasurementPolicy } from '../src/MeasurementPolicy.js'

type Measured = { fingerprint: string; measurements: BaselineMeasurement[] }

const PX = 'overflow-excess-px/v1'
const COUNT = 'affected-elements/v1'

const at = (
  context: string,
  observed: number,
  metric = PX,
): BaselineMeasurement => ({ metric, context, observed })
const finding = (...measurements: BaselineMeasurement[]): Measured => ({
  fingerprint: 'f',
  measurements,
})
const baseline = (...measurements: BaselineMeasurement[]): BaselineFile => ({
  schemaVersion: 1,
  toolVersion: '1',
  entries: ['f'],
  measurements: { f: measurements },
})
const TOLERANCES = new Map([
  [PX, 1],
  [COUNT, 0],
])
const policy: MeasurementPolicy<Measured> = {
  measurementsOf: (item) => item.measurements,
  toleranceOf: (metric) => TOLERANCES.get(metric),
}

describe('classifyFindings with measurements', () => {
  it('keeps a value within tolerance known and fails one beyond it', () => {
    const accepted = baseline(at('390', 20))
    for (const [observed, worse] of [
      [19, false],
      [20, false],
      [21, false],
      [22, true],
    ] as const) {
      const classified = classifyFindings(
        [finding(at('390', observed))],
        accepted,
        policy,
      )
      expect(classified.worsened.length > 0).toBe(worse)
      expect(classified.new.length > 0).toBe(worse)
      expect(classified.resolved).toEqual([])
    }
  })

  it('compares counts exactly', () => {
    const classified = classifyFindings(
      [finding(at('390', 4, COUNT))],
      baseline(at('390', 3, COUNT)),
      policy,
    )
    expect(classified.worsened).toHaveLength(1)
  })

  it('compares each screen with its own record, so a worse one is not hidden', () => {
    const classified = classifyFindings(
      [finding(at('1440', 2), at('390', 90))],
      baseline(at('1440', 2), at('390', 10)),
      policy,
    )
    expect(classified.worsened).toHaveLength(1)
  })

  it('does not compare a screen or a metric it has no record or tolerance for', () => {
    const classified = classifyFindings(
      [finding(at('768', 500), at('390', 99, 'unknown/v1'))],
      baseline(at('390', 1)),
      policy,
    )
    expect(classified.known).toHaveLength(1)
  })

  it('compares against the accepted value, so small rises cannot accumulate', () => {
    const accepted = baseline(at('390', 20))
    const steps = [21, 22, 23].map(
      (observed) =>
        classifyFindings([finding(at('390', observed))], accepted, policy)
          .worsened.length,
    )
    expect(steps).toEqual([0, 1, 1])
  })

  it('stays count-only without a policy or without recorded values', () => {
    expect(
      classifyFindings([finding(at('390', 500))], baseline(at('390', 1))).known,
    ).toHaveLength(1)
    expect(
      classifyFindings(
        [finding(at('390', 500))],
        { schemaVersion: 1, toolVersion: '1', entries: ['f'] },
        policy,
      ).known,
    ).toHaveLength(1)
  })
})
