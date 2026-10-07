import { describe, expect, it } from 'vitest'

import { rgbaToOklch } from '@/color/rgbaToOklch.js'
import { grayOnColor } from '@/rules/grayOnColor.js'
import { lineLength } from '@/rules/lineLength.js'
import { textCramped } from '@/rules/textCramped.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('rgbaToOklch', () => {
  it('puts white at lightness 1 and chroma 0, and blue at a high chroma', () => {
    const white = rgbaToOklch([255, 255, 255, 1])
    expect(white.l).toBeCloseTo(1, 2)
    expect(white.c).toBeCloseTo(0, 2)
    const blue = rgbaToOklch([37, 99, 235, 1])
    expect(blue.c).toBeGreaterThan(0.15)
    expect(blue.h).toBeGreaterThan(250)
    expect(blue.h).toBeLessThan(270)
  })
})

describe('grayOnColor', () => {
  const fill = (color: [number, number, number, number]) =>
    elementBox({
      id: 0,
      backgroundColor: color,
      text: 'Upgrade',
      textLength: 7,
      color: [128, 128, 128, 1],
    })
  it('reports mid grey on a saturated fill', () => {
    const findings = grayOnColor(
      snapshotOf([fill([37, 99, 235, 1])]),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
  })
  it('accepts grey on white or on a pale tint, white on a fill, and a disabled control', () => {
    expect(
      grayOnColor(snapshotOf([fill([255, 255, 255, 1])]), ruleContext()),
    ).toEqual([])
    expect(
      grayOnColor(snapshotOf([fill([239, 246, 255, 1])]), ruleContext()),
    ).toEqual([])
    expect(
      grayOnColor(
        snapshotOf([{ ...fill([37, 99, 235, 1]), color: [255, 255, 255, 1] }]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      grayOnColor(
        snapshotOf([{ ...fill([37, 99, 235, 1]), disabled: true }]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('does not judge text over a gradient or an image', () => {
    expect(
      grayOnColor(
        snapshotOf([{ ...fill([37, 99, 235, 1]), hasBackgroundImage: true }]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('lineLength', () => {
  const paragraph = (measureCh: number, overrides = {}) =>
    elementBox({
      id: 0,
      tag: 'p',
      text: 'Words',
      textLength: 300,
      lines: 3,
      measureCh,
      ...overrides,
    })
  it('reports a wrapped paragraph over 80ch', () => {
    expect(
      lineLength(snapshotOf([paragraph(120)]), ruleContext()),
    ).toHaveLength(1)
  })
  it('accepts 80ch or fewer, other tags and text in a table', () => {
    expect(lineLength(snapshotOf([paragraph(80)]), ruleContext())).toEqual([])
    expect(
      lineLength(snapshotOf([paragraph(120, { tag: 'div' })]), ruleContext()),
    ).toEqual([])
    const cell = elementBox({ id: 0, tag: 'td' })
    expect(
      lineLength(
        snapshotOf([cell, paragraph(120, { id: 1, parent: 0 })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('textCramped', () => {
  const border = Array.from({ length: 4 }, () => [209, 213, 219, 1]) as never
  const box = (overrides = {}) =>
    elementBox({
      id: 0,
      x: 100,
      width: 100,
      height: 40,
      borderWidths: [1, 1, 1, 1],
      borderColors: border,
      text: 'Beta',
      textLength: 4,
      lines: 1,
      textLeft: 104,
      textRight: 190,
      ...overrides,
    })
  it('reports text closer than 8px to a drawn edge', () => {
    const findings = textCramped(snapshotOf([box()]), ruleContext())
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain('3px')
  })
  it('accepts roomy text, chips at 6px, controls and table cells', () => {
    expect(
      textCramped(
        snapshotOf([box({ textLeft: 112, textRight: 188 })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      textCramped(
        snapshotOf([box({ height: 20, textLeft: 107, textRight: 192 })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      textCramped(snapshotOf([box({ isControl: true })]), ruleContext()),
    ).toEqual([])
    expect(
      textCramped(snapshotOf([box({ tag: 'td' })]), ruleContext()),
    ).toEqual([])
  })
  it('measures a descendant text and ignores a box that draws no edge', () => {
    const outer = box({ text: '', lines: 0 })
    const inner = elementBox({
      id: 1,
      parent: 0,
      lines: 1,
      text: 'x',
      textLeft: 103,
      textRight: 150,
    })
    expect(textCramped(snapshotOf([outer, inner]), ruleContext())).toHaveLength(
      1,
    )
    expect(
      textCramped(
        snapshotOf([box({ borderWidths: [0, 0, 0, 0] })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
