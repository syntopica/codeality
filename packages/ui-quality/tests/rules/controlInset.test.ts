import { describe, expect, it } from 'vitest'

import { controlInset } from '@/rules/controlInset.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const line: [number, number, number, number] = [229, 231, 235, 1]
const header = elementBox({
  id: 0,
  selector: 'header',
  width: 1000,
  height: 64,
  backgroundColor: [255, 255, 255, 1],
})
const wrapper = elementBox({ id: 1, parent: 0, width: 1000, height: 64 })
const input = (y: number, height: number) =>
  elementBox({
    id: 2,
    parent: 1,
    x: 32,
    y,
    width: 600,
    height,
    isControl: true,
    borderWidths: [1, 1, 1, 1],
    borderColors: [line, line, line, line],
  })

describe('controlInset', () => {
  it('reports a bordered control touching its container', () => {
    const findings = controlInset(
      snapshotOf([header, wrapper, input(0, 64)]),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain(
      '0px from the top, 0px from the bottom of header',
    )
  })
  it('accepts an inset control, a borderless one and one with no container', () => {
    expect(
      controlInset(snapshotOf([header, wrapper, input(12, 40)]), ruleContext()),
    ).toEqual([])
    const borderless = {
      ...input(0, 64),
      borderWidths: [0, 0, 0, 0] as [number, number, number, number],
    }
    expect(
      controlInset(snapshotOf([header, wrapper, borderless]), ruleContext()),
    ).toEqual([])
    const ruled = {
      ...header,
      backgroundColor: null,
      borderWidths: [1, 0, 0, 0] as [number, number, number, number],
      borderColors: [line, null, null, null] as typeof header.borderColors,
    }
    const flush = { ...input(12, 40), x: 0 }
    expect(
      controlInset(snapshotOf([ruled, wrapper, flush]), ruleContext()),
    ).toEqual([])
    const scroller = { ...wrapper, overflowY: 'auto' }
    expect(
      controlInset(
        snapshotOf([header, scroller, input(80, 40)]),
        ruleContext(),
      ),
    ).toEqual([])
    const orphan = { ...input(0, 64), parent: null }
    expect(controlInset(snapshotOf([orphan]), ruleContext())).toEqual([])
  })
})
