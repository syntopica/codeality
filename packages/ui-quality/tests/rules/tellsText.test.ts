import type { MotionRecord } from '@/model/MotionRecord.js'
import { eyebrowLabel } from '@/rules/eyebrowLabel.js'
import { pulsingDecoration } from '@/rules/pulsingDecoration.js'
import { purpleGradient } from '@/rules/purpleGradient.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

describe('eyebrowLabel', () => {
  const eyebrow = elementBox({
    id: 1,
    parent: 0,
    tag: 'p',
    text: 'Features',
    textLength: 8,
    fontSize: 12,
    textTransform: 'uppercase',
    selector: 'p.eyebrow',
  })
  const heading = (size: number, tag = 'h2') =>
    elementBox({
      id: 2,
      parent: 0,
      tag,
      fontSize: size,
      text: 'Everything',
      textLength: 10,
    })
  const parent = elementBox({ id: 0 })
  it('reports a small capitalised label right above a large heading', () => {
    expect(
      eyebrowLabel(snapshotOf([parent, eyebrow, heading(32)]), ruleContext()),
    ).toHaveLength(1)
    const spaced = { ...eyebrow, textTransform: 'none', letterSpacing: 1.2 }
    expect(
      eyebrowLabel(snapshotOf([parent, spaced, heading(32)]), ruleContext()),
    ).toHaveLength(1)
  })
  it('accepts a small heading, a body paragraph, a long label and a label before text', () => {
    expect(
      eyebrowLabel(snapshotOf([parent, eyebrow, heading(16)]), ruleContext()),
    ).toEqual([])
    expect(
      eyebrowLabel(
        snapshotOf([parent, eyebrow, heading(32, 'p')]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      eyebrowLabel(
        snapshotOf([parent, { ...eyebrow, textLength: 60 }, heading(32)]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      eyebrowLabel(
        snapshotOf([parent, { ...eyebrow, fontSize: 16 }, heading(32)]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      eyebrowLabel(
        snapshotOf([
          parent,
          { ...eyebrow, textTransform: 'none' },
          heading(32),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('pulsingDecoration', () => {
  const dot = (overrides: Partial<MotionRecord> = {}): MotionRecord => ({
    selector: 'div.dot',
    signature: 'div.dot',
    width: 8,
    height: 8,
    properties: ['opacity'],
    scales: false,
    infinite: true,
    duration: 2000,
    ...overrides,
  })
  const rulesOn = (freeAnimations: MotionRecord[]) =>
    pulsingDecoration(snapshotOf([], { freeAnimations }), ruleContext())
  it('reports a small element that pulses for ever, by opacity or scale', () => {
    expect(rulesOn([dot()])).toHaveLength(1)
    expect(
      rulesOn([dot({ properties: ['transform'], scales: true })]),
    ).toHaveLength(1)
  })
  it('accepts a spinner, a finite animation and anything 16px or larger', () => {
    expect(rulesOn([dot({ properties: ['transform'] })])).toEqual([])
    expect(rulesOn([dot({ infinite: false })])).toEqual([])
    expect(rulesOn([dot({ width: 16, height: 16 })])).toEqual([])
  })
})

describe('purpleGradient', () => {
  const surface = (stops: [number, number, number, number][], overrides = {}) =>
    elementBox({
      id: 0,
      width: 1400,
      height: 500,
      gradientStops: stops,
      ...overrides,
    })
  const violet: [number, number, number, number] = [124, 58, 237, 1]
  const slate: [number, number, number, number] = [30, 58, 138, 1]
  it('reports a large gradient with a purple stop', () => {
    expect(
      purpleGradient(snapshotOf([surface([violet, slate])]), ruleContext()),
    ).toHaveLength(1)
  })
  it('accepts a small surface, a blue gradient and a purple brand palette', () => {
    expect(
      purpleGradient(
        snapshotOf([surface([violet, slate], { height: 100 })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      purpleGradient(
        snapshotOf([surface([slate, [37, 99, 235, 1]])]),
        ruleContext(),
      ),
    ).toEqual([])
    const brand = ruleContext({
      palette: [{ rgba: violet, lab: [40, 60, -70] }],
    })
    expect(
      purpleGradient(snapshotOf([surface([violet, slate])]), brand),
    ).toEqual([])
  })
})
