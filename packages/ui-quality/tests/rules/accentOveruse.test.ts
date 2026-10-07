import { describe, expect, it } from 'vitest'

import { hexToRgba } from '@/color/hexToRgba.js'
import { accentOveruse } from '@/rules/accentOveruse.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { subjectsOf } from '@tests/subjectsOf.js'

const BLUE = hexToRgba('#2563eb')
const GREY = hexToRgba('#e5e7eb')

describe('accentOveruse', () => {
  const main = elementBox({ id: 0, isMain: true, selector: 'main' })
  const button = (id: number, parent: number, fill = BLUE) =>
    elementBox({
      id,
      parent,
      tag: 'button',
      text: `Action ${String(id)}`,
      backgroundColor: fill,
    })
  it('reports two accent buttons in one main region', () => {
    const [finding] = accentOveruse(
      snapshotOf([
        main,
        elementBox({ id: 1, parent: 0 }),
        button(2, 1),
        button(3, 0),
      ]),
      ruleContext(),
    )
    expect(finding?.subject).toBe('main')
    expect(finding?.message).toContain('Action 2, Action 3')
  })
  it('gives an action bar one accent of its own', () => {
    const bar = elementBox({ id: 1, parent: 0, selector: 'div.bulk' })
    expect(
      subjectsOf(accentOveruse, [
        main,
        bar,
        button(2, 1),
        button(3, 1, GREY),
        button(4, 0),
      ]),
    ).toEqual([])
    expect(
      subjectsOf(accentOveruse, [main, bar, button(2, 1), button(3, 1)]),
    ).toEqual(['div.bulk'])
  })
  it('uses the configured accent over the most saturated fill', () => {
    const red = hexToRgba('#dc2626')
    const boxes = [main, button(1, 0), button(2, 0), button(3, 0, red)]
    expect(subjectsOf(accentOveruse, boxes, { accent: red })).toEqual([])
    expect(subjectsOf(accentOveruse, boxes, { accent: BLUE })).toEqual(['main'])
  })
  it('leaves grey buttons, disabled ones, plain links and the page chrome alone', () => {
    const link = elementBox({
      id: 3,
      parent: 0,
      tag: 'a',
      backgroundColor: BLUE,
    })
    expect(
      subjectsOf(accentOveruse, [
        main,
        button(1, 0, GREY),
        button(2, 0, GREY),
        link,
        { ...button(4, 0), disabled: true },
        button(5, 0),
        button(6, 7),
        elementBox({ id: 7 }),
        button(8, 7),
      ]),
    ).toEqual([])
  })
})
