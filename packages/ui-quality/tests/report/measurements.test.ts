import { describe, expect, it } from 'vitest'

import type { RawFinding } from '@/model/RawFinding.js'
import type { Screen } from '@/model/Screen.js'
import { findingDiagnostic } from '@/report/findingDiagnostic.js'
import { mergeFindings } from '@/report/mergeFindings.js'
import { toFinding } from '@/report/toFinding.js'
import { axeFindings } from '@/rules/axeFindings.js'
import { groupRawFindings } from '@/rules/groupRawFindings.js'
import { horizontalOverflow } from '@/rules/horizontalOverflow.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const OVERFLOW = 'overflow-excess-px/v1'

const screen = (width: number): Screen => ({
  route: '/inbox',
  viewport: { width, height: 900 },
  colorScheme: 'light',
})
const overflow = (observed: number): RawFinding => ({
  rule: 'horizontal-overflow',
  severity: 'error',
  message: 'm',
  subject: 'html',
  identity: 'document',
  measurement: { metric: OVERFLOW, observed, threshold: 1 },
})

describe('measured findings', () => {
  it('measures the overflow excess and the affected axe elements', () => {
    expect(
      horizontalOverflow(
        snapshotOf([], { documentWidth: 500, viewportWidth: 390 }),
        ruleContext(),
      )[0]?.measurement,
    ).toEqual({ metric: OVERFLOW, observed: 110, threshold: 1 })
    const axe = [
      {
        id: 'color-contrast',
        impact: 'serious',
        help: 'Contrast',
        nodes: [
          { target: 'a', summary: '' },
          { target: 'b', summary: '' },
          { target: 'c', summary: '' },
        ],
      },
    ]
    expect(
      axeFindings(snapshotOf([], { axe }), ruleContext())[0]?.measurement,
    ).toEqual({ metric: 'affected-elements/v1', observed: 3 })
  })

  it('keeps the worst measurement when grouping, whatever the order', () => {
    for (const order of [
      [overflow(5), overflow(40), overflow(12)],
      [overflow(40), overflow(12), overflow(5)],
    ]) {
      const [grouped] = groupRawFindings(order)
      expect(grouped?.measurement?.observed).toBe(40)
    }
  })

  it('keeps one measurement per screen across a merge, and reports the worst', () => {
    const [merged] = mergeFindings([
      toFinding(overflow(8), screen(1440)),
      toFinding(overflow(120), screen(390)),
    ])
    expect(merged?.measurements).toEqual([
      {
        metric: OVERFLOW,
        observed: 8,
        threshold: 1,
        screen: '1440x900 light',
      },
      {
        metric: OVERFLOW,
        observed: 120,
        threshold: 1,
        screen: '390x900 light',
      },
    ])
    expect(merged && findingDiagnostic(merged)).toMatchObject({
      observed: 120,
      threshold: 1,
    })
  })

  it('keeps the worst of two captures of one screen, whatever the order', () => {
    for (const values of [
      [8, 120],
      [120, 8],
    ]) {
      const [merged] = mergeFindings(
        values.map((observed) => toFinding(overflow(observed), screen(390))),
      )
      expect(merged?.measurements?.map((m) => m.observed)).toEqual([120])
    }
  })

  it('gives no observed for an empty measurement list', () => {
    const finding = { ...toFinding(overflow(3), screen(390)), measurements: [] }
    expect(findingDiagnostic(finding)).not.toHaveProperty('observed')
  })

  it('leaves an unmeasured finding without measurements or observed', () => {
    const { measurement: _, ...unmeasured } = overflow(1)
    const finding = toFinding(unmeasured, screen(1440))
    expect(finding).not.toHaveProperty('measurements')
    expect(findingDiagnostic(finding)).not.toHaveProperty('observed')
  })
})
