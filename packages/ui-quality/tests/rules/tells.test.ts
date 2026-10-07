import type { ShadowLayer } from '@/model/ShadowLayer.js'
import { glowShadow } from '@/rules/glowShadow.js'
import { gradientText } from '@/rules/gradientText.js'
import { sideStripeAccent } from '@/rules/sideStripeAccent.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

const shadow = (overrides: Partial<ShadowLayer> = {}): ShadowLayer => ({
  x: 0,
  y: 0,
  blur: 24,
  spread: 0,
  inset: false,
  color: [34, 211, 238, 1],
  ...overrides,
})

describe('gradientText', () => {
  const heading = (overrides = {}) =>
    elementBox({
      id: 0,
      tag: 'h1',
      text: 'Launch',
      textLength: 6,
      clipsText: true,
      hasGradient: true,
      ...overrides,
    })
  it('reports text clipped out of a gradient', () => {
    expect(gradientText(snapshotOf([heading()]), ruleContext())).toHaveLength(1)
  })
  it('accepts a clipped image, a gradient fill and a solid heading', () => {
    expect(
      gradientText(
        snapshotOf([heading({ hasGradient: false })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      gradientText(snapshotOf([heading({ clipsText: false })]), ruleContext()),
    ).toEqual([])
  })
})

describe('glowShadow', () => {
  const box = (boxShadows: ShadowLayer[], overrides = {}) =>
    elementBox({ id: 0, boxShadows, ...overrides })
  it('reports a centred coloured blur, and any coloured blur on a dark surface', () => {
    expect(
      glowShadow(snapshotOf([box([shadow()])]), ruleContext()),
    ).toHaveLength(1)
    const dark = box([shadow({ y: 8, blur: 4 })], {
      backgroundColor: [15, 23, 42, 1],
    })
    expect(glowShadow(snapshotOf([dark]), ruleContext())).toHaveLength(1)
    const text = elementBox({ id: 0, textShadows: [shadow({ blur: 10 })] })
    expect(glowShadow(snapshotOf([text]), ruleContext())).toHaveLength(1)
  })
  it('accepts grey shadows, rings, offset blurs on light surfaces and inset glows', () => {
    expect(
      glowShadow(
        snapshotOf([box([shadow({ color: [0, 0, 0, 0.2] })])]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      glowShadow(snapshotOf([box([shadow({ blur: 0 })])]), ruleContext()),
    ).toEqual([])
    expect(
      glowShadow(snapshotOf([box([shadow({ y: 8, blur: 4 })])]), ruleContext()),
    ).toEqual([])
    expect(
      glowShadow(snapshotOf([box([shadow({ inset: true })])]), ruleContext()),
    ).toEqual([])
  })
})

describe('sideStripeAccent', () => {
  const blue = [37, 99, 235, 1] as [number, number, number, number]
  const callout = (overrides = {}) =>
    elementBox({
      id: 0,
      height: 64,
      padding: [16, 16, 16, 16],
      borderRadius: 8,
      borderWidths: [0, 0, 0, 4],
      borderColors: [null, null, null, blue],
      selector: 'div.callout',
      ...overrides,
    })
  it('reports a card with one thick side border', () => {
    expect(
      sideStripeAccent(snapshotOf([callout()]), ruleContext()),
    ).toHaveLength(1)
    const right = callout({
      borderWidths: [1, 4, 1, 1],
      borderColors: [
        [209, 213, 219, 1],
        blue,
        [209, 213, 219, 1],
        [209, 213, 219, 1],
      ],
    })
    expect(
      sideStripeAccent(snapshotOf([right]), ruleContext())[0]?.message,
    ).toContain('right')
  })
  it('accepts a full border, a thin stripe, a quotation and an unpadded or flat box', () => {
    const full = callout({
      borderWidths: [4, 4, 4, 4],
      borderColors: [blue, blue, blue, blue],
    })
    expect(sideStripeAccent(snapshotOf([full]), ruleContext())).toEqual([])
    expect(
      sideStripeAccent(
        snapshotOf([callout({ borderWidths: [0, 0, 0, 2] })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      sideStripeAccent(
        snapshotOf([callout({ tag: 'blockquote' })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      sideStripeAccent(
        snapshotOf([callout({ padding: [0, 0, 0, 0] })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      sideStripeAccent(
        snapshotOf([callout({ borderRadius: 0 })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
