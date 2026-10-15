import { describe, expect, it } from 'vitest'

import { RULE_DEFAULTS } from '@/config/RULE_DEFAULTS.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { controlRowRagged } from '@/rules/controlRowRagged.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const line: [number, number, number, number] = [229, 231, 235, 1]
const bordered = {
  borderWidths: [1, 1, 1, 1] as [number, number, number, number],
  borderColors: [line, line, line, line] as ElementBox['borderColors'],
}
const card = elementBox({
  id: 0,
  selector: 'section.card',
  width: 1000,
  height: 120,
  borderRadius: 8,
  ...bordered,
})
const field = (
  id: number,
  x: number,
  y: number,
  overrides: Partial<ElementBox> = {},
) =>
  elementBox({
    id,
    parent: 0,
    selector: `#f${String(id)}`,
    tag: 'input',
    x,
    y,
    width: 150,
    height: 32,
    fontSize: 14,
    isControl: true,
    isTextEntry: true,
    ...bordered,
    ...overrides,
  })
const button = (id: number, x: number, y: number, height: number) =>
  elementBox({
    id,
    parent: 0,
    selector: `#b${String(id)}`,
    tag: 'button',
    x,
    y,
    width: 80,
    height,
    tappable: true,
    backgroundColor: [37, 99, 235, 1],
  })
const run = (elements: ElementBox[], options = RULE_DEFAULTS) =>
  controlRowRagged(snapshotOf([card, ...elements]), ruleContext({ options }))

describe('controlRowRagged', () => {
  // Vertica's inline edit row (2026-10-16): a 12px date input above a
  // helper text, a text input centred 4px lower in its taller cell, a
  // top-aligned select trigger and a 36px button.
  const vertica = [
    field(1, 0, 10, { inputType: 'date', fontSize: 12 }),
    field(2, 158, 14),
    field(3, 316, 10, {
      tag: 'button',
      isControl: false,
      isTextEntry: false,
      role: 'combobox',
    }),
    button(4, 474, 10, 36),
  ]
  it('reports a line of controls of different heights, centres and font sizes', () => {
    const findings = run(vertica)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain(
      '4 controls on one line do not line up (heights 32-36px, centres 4px apart, text 12px vs 14px)',
    )
    expect(findings[0]?.message).toContain('#b4 36px at y=10')
    expect(findings[0]?.subject).toBe('#f1')
    expect(findings[0]?.identity).toBe('#f1|#f2|#f3|#b4')
  })
  it('reports equal boxes whose tops differ, and font sizes alone', () => {
    expect(run([field(1, 0, 10), field(2, 158, 14)])[0]?.message).toContain(
      '(centres 4px apart)',
    )
    expect(
      run([field(1, 0, 10), field(2, 158, 10, { fontSize: 12 })])[0]?.message,
    ).toContain('(text 12px vs 14px)')
  })
  it('accepts an even line, and a tolerance raised past the offset', () => {
    expect(
      run([field(1, 0, 10), field(2, 158, 10), button(3, 316, 10, 32)]),
    ).toEqual([])
    const loose = {
      ...RULE_DEFAULTS,
      controlRowRagged: { tolerance: 4, maxGap: 48 },
    }
    expect(run([field(1, 0, 10), field(2, 158, 14)], loose)).toEqual([])
  })
  it('compares only the top of a multi-line textarea', () => {
    const notes = field(2, 158, 10, { tag: 'textarea', height: 96 })
    expect(run([field(1, 0, 10), notes])).toEqual([])
    expect(run([field(1, 0, 10), { ...notes, y: 16 }])[0]?.message).toContain(
      '(tops 6px apart)',
    )
  })
  it('leaves out lines that are not one row of boxes in one card', () => {
    // A wrapping toolbar: the second line is below the first.
    expect(run([field(1, 0, 10), button(2, 158, 50, 40)])).toEqual([])
    // A search on the left of a bar and an action on the far right.
    expect(run([field(1, 0, 10), button(2, 600, 10, 36)])).toEqual([])
    // A painted button drawn inside a field.
    expect(run([field(1, 0, 10), button(2, 100, 14, 24)])).toEqual([])
    // The same line split across two cards.
    const other = elementBox({
      id: 9,
      width: 1000,
      borderRadius: 8,
      ...bordered,
    })
    const elsewhere = { ...button(2, 158, 10, 36), parent: 9 }
    expect(
      controlRowRagged(
        snapshotOf([card, other, field(1, 0, 10), elsewhere]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('leaves out links, toggles, ghost buttons and controls off the page', () => {
    const base = field(1, 0, 10)
    const link = { ...button(2, 158, 10, 36), tag: 'a' }
    const toggle = { ...button(2, 158, 10, 36), role: 'switch' }
    const ghost = { ...button(2, 158, 10, 36), backgroundColor: null }
    const offscreen = { ...field(2, -400, 10, { height: 40 }), x: -400 }
    for (const other of [link, toggle, ghost, offscreen])
      expect(run([base, other])).toEqual([])
  })
})
