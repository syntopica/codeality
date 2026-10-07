import { describe, expect, it } from 'vitest'

import { textClipped } from '@/rules/textClipped.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('textClipped', () => {
  it('reports a select whose content box is shorter than its line', () => {
    const select = (contentHeight: number) =>
      elementBox({ id: 0, tag: 'select', contentHeight, lineBoxHeight: 17 })
    expect(
      textClipped(snapshotOf([select(10)]), ruleContext())[0]?.message,
    ).toContain('10px content box is 7px shorter than one 17px line')
    expect(textClipped(snapshotOf([select(26)]), ruleContext())).toEqual([])
  })
  it('reports own overflow without an ellipsis, and accepts one with it', () => {
    const clipped = elementBox({
      id: 0,
      text: 'long text',
      overflowX: 'hidden',
      scrollWidth: 300,
      clientWidth: 100,
    })
    expect(
      textClipped(snapshotOf([clipped]), ruleContext())[0]?.message,
    ).toContain('cut 200px short')
    const ellipsis = { ...clipped, textOverflow: 'ellipsis' }
    expect(textClipped(snapshotOf([ellipsis]), ruleContext())).toEqual([])
  })
  it('reports text running past a clipping ancestor', () => {
    const box = elementBox({
      id: 0,
      overflowX: 'hidden',
      width: 200,
      selector: 'div.box',
    })
    const wrapper = elementBox({ id: 1, parent: 0, width: 200 })
    const text = elementBox({ id: 2, parent: 1, text: 'too wide', width: 260 })
    const findings = textClipped(
      snapshotOf([box, wrapper, text]),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain('runs 60px past div.box')
    const fits = { ...text, width: 180 }
    expect(
      textClipped(snapshotOf([box, wrapper, fits]), ruleContext()),
    ).toEqual([])
    const untexted = { ...text, text: '' }
    expect(
      textClipped(snapshotOf([box, wrapper, untexted]), ruleContext()),
    ).toEqual([])
    const scroller = { ...wrapper, overflowX: 'auto' }
    expect(
      textClipped(snapshotOf([box, scroller, text]), ruleContext()),
    ).toEqual([])
    const ellipsis = { ...box, textOverflow: 'ellipsis' }
    expect(
      textClipped(snapshotOf([ellipsis, wrapper, text]), ruleContext()),
    ).toEqual([])
    const free = elementBox({ id: 0, text: 'no clipper', width: 5000 })
    expect(textClipped(snapshotOf([free]), ruleContext())).toEqual([])
  })
})
