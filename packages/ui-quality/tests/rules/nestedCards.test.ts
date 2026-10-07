import { describe, expect, it } from 'vitest'

import { hexToRgba } from '@/color/hexToRgba.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { nestedCards } from '@/rules/nestedCards.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { subjectsOf } from '@tests/subjectsOf.js'

const BORDER = hexToRgba('#d1d5db')
const GREY = hexToRgba('#e5e7eb')

const card = (overrides: Partial<ElementBox> & { id: number }) =>
  elementBox({
    height: 120,
    borderRadius: 8,
    padding: [16, 16, 16, 16],
    borderWidths: [1, 1, 1, 1],
    borderColors: [BORDER, BORDER, BORDER, BORDER],
    ...overrides,
  })

describe('nestedCards', () => {
  it('reports the outer card once, however many it holds', () => {
    expect(
      subjectsOf(nestedCards, [
        card({ id: 0, selector: 'section.outer' }),
        card({ id: 1, parent: 0 }),
        elementBox({ id: 2, parent: 0 }),
        card({ id: 3, parent: 2, shadowBlur: 6, borderWidths: [0, 0, 0, 0] }),
      ]),
    ).toEqual(['section.outer'])
  })
  it('counts a card drawn by its fill alone', () => {
    const [finding] = nestedCards(
      snapshotOf([
        card({ id: 0, selector: 'section.outer' }),
        card({
          id: 1,
          parent: 0,
          borderWidths: [0, 0, 0, 0],
          backgroundColor: GREY,
        }),
      ]),
      ruleContext(),
    )
    expect(finding?.message).toContain('holds 1 card inside')
  })
  it('leaves controls, badges, dialogs, flat panels and distant cards alone', () => {
    expect(
      subjectsOf(nestedCards, [
        card({ id: 0 }),
        card({ id: 1, parent: 0, tag: 'button' }),
        card({ id: 2, parent: 0, height: 24 }),
        card({ id: 3, parent: 0, isDialog: true }),
        card({ id: 4, parent: 0, position: 'absolute' }),
        card({ id: 5, parent: 0, padding: [4, 16, 4, 16] }),
        card({ id: 6, parent: 0, borderRadius: 0 }),
        card({ id: 7, parent: 0, borderWidths: [0, 0, 0, 0] }),
        elementBox({ id: 8, parent: 0 }),
        elementBox({ id: 9, parent: 8 }),
        elementBox({ id: 10, parent: 9 }),
        card({ id: 11, parent: 10 }),
      ]),
    ).toEqual([])
  })
})
