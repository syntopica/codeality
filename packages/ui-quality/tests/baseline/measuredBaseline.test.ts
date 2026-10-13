import { describe, expect, it } from 'vitest'

import { recordedMeasurements } from '@/baseline/recordedMeasurements.js'
import { renderClassified } from '@/baseline/renderClassified.js'
import { UI_MEASUREMENT_POLICY } from '@/baseline/UI_MEASUREMENT_POLICY.js'
import type { Finding } from '@/model/Finding.js'
import { classifyFindings } from '@syntopica/gate-kit/classifyFindings'

const overflow = (observed: number): Finding => ({
  rule: 'horizontal-overflow',
  severity: 'error',
  route: '/',
  screens: ['390x844 light'],
  message: 'm',
  subject: 'html',
  fingerprint: 'f',
  measurements: [
    {
      metric: 'overflow-excess-px/v1',
      observed,
      threshold: 1,
      screen: '390x844 light',
    },
  ],
})

const accepted = (finding: Finding) => ({
  schemaVersion: 1 as const,
  toolVersion: '1',
  entries: [finding.fingerprint],
  measurements: recordedMeasurements([finding]),
})

describe('measured UI baseline', () => {
  it('records each screen measurement under the fingerprint', () => {
    expect(recordedMeasurements([overflow(37)])).toEqual({
      f: [
        {
          metric: 'overflow-excess-px/v1',
          context: '390x844 light',
          observed: 37,
        },
      ],
    })
  })

  it('fails a baselined overflow that grew past the pixel tolerance', () => {
    const baseline = accepted(overflow(37))
    expect(
      classifyFindings([overflow(38)], baseline, UI_MEASUREMENT_POLICY).new,
    ).toEqual([])
    const grown = classifyFindings(
      [overflow(200)],
      baseline,
      UI_MEASUREMENT_POLICY,
    )
    expect(grown.worsened).toHaveLength(1)
    expect(renderClassified(grown)).toMatch(
      /^1 new \(1 worse than recorded\), 0 known, 0 resolved\n/u,
    )
  })

  it('records nothing for an unmeasured finding', () => {
    const { measurements: _, ...unmeasured } = overflow(1)
    expect(recordedMeasurements([unmeasured])).toEqual({})
  })
})
