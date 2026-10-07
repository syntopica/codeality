import { describe, expect, it } from 'vitest'

import type { MotionRecord } from '@/model/MotionRecord.js'
import { clickableNonSemantic } from '@/rules/clickableNonSemantic.js'
import { layoutAnimation } from '@/rules/layoutAnimation.js'
import { reducedMotionIgnored } from '@/rules/reducedMotionIgnored.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const motion = (overrides: Partial<MotionRecord> = {}): MotionRecord => ({
  selector: 'div.spinner',
  signature: 'div.spinner',
  width: 24,
  height: 24,
  properties: ['transform'],
  scales: false,
  infinite: true,
  duration: 1000,
  ...overrides,
})

describe('reducedMotionIgnored', () => {
  const rulesOn = (animations: MotionRecord[]) =>
    reducedMotionIgnored(snapshotOf([], { animations }), ruleContext())
  it('reports a transform animation and a long opacity loop that run with motion reduced', () => {
    expect(rulesOn([motion()])).toHaveLength(1)
    expect(
      rulesOn([motion({ properties: ['opacity'], duration: 2000 })]),
    ).toHaveLength(1)
  })
  it('accepts short opacity loops, finite colour changes and no animation', () => {
    expect(
      rulesOn([motion({ properties: ['opacity'], duration: 800 })]),
    ).toEqual([])
    expect(
      rulesOn([motion({ properties: ['backgroundColor'], infinite: false })]),
    ).toEqual([])
    expect(rulesOn([])).toEqual([])
  })
})

describe('layoutAnimation', () => {
  it('reports a layout transition and a control slower than 300ms', () => {
    const findings = layoutAnimation(
      snapshotOf([
        elementBox({ id: 0, layoutTransition: true, signature: 'div.panel' }),
        elementBox({
          id: 1,
          tag: 'button',
          tappable: true,
          transitionMs: 500,
          signature: 'button.save',
        }),
      ]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.identity)).toEqual([
      'layout:div.panel',
      'duration:button.save',
    ])
  })
  it('accepts a 300ms control, and a long transition on a plain box', () => {
    expect(
      layoutAnimation(
        snapshotOf([
          elementBox({ id: 0, tappable: true, transitionMs: 300 }),
          elementBox({ id: 1, transitionMs: 800 }),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('clickableNonSemantic', () => {
  const pointer = (id: number, overrides = {}) =>
    elementBox({
      id,
      cursor: 'pointer',
      selector: `#p${String(id)}`,
      ...overrides,
    })
  it('reports a pointer cursor on a div, once for the topmost box of the area', () => {
    const findings = clickableNonSemantic(
      snapshotOf([pointer(0), pointer(1, { parent: 0, tag: 'span' })]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['#p0'])
  })
  it('accepts links, buttons, widgets, wrappers of them and disabled boxes', () => {
    expect(
      clickableNonSemantic(
        snapshotOf([
          pointer(0, { semantic: true }),
          pointer(1, { wrapsInteractive: true }),
          pointer(2, { disabled: true }),
          elementBox({ id: 3 }),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
