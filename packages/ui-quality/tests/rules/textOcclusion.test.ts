import { describe, expect, it } from 'vitest'

import { hexToRgba } from '@/color/hexToRgba.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { textOcclusion } from '@/rules/textOcclusion.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { subjectsOf } from '@tests/subjectsOf.js'

describe('textOcclusion', () => {
  const text = elementBox({
    id: 0,
    text: 'Payment terms apply',
    selector: 'p.note',
    occluder: 1,
  })
  const cover = (overrides: Partial<ElementBox> = {}) =>
    elementBox({
      id: 1,
      y: 4,
      backgroundColor: hexToRgba('#1e293b'),
      ...overrides,
    })
  it('reports text an opaque sibling paints over', () => {
    const [finding] = textOcclusion(snapshotOf([text, cover()]), ruleContext())
    expect(finding?.subject).toBe('p.note')
    expect(finding?.message).toContain('#e1')
  })
  it('counts a picture as opaque', () => {
    expect(
      subjectsOf(textOcclusion, [
        text,
        cover({ tag: 'img', backgroundColor: null }),
      ]),
    ).toEqual(['p.note'])
  })
  it('leaves glass, slivers, dialogs, backdrops and unsampled text alone', () => {
    const dialog = elementBox({ id: 2, isDialog: true })
    for (const boxes of [
      [text, cover({ backgroundColor: [30, 41, 59, 0.5] })],
      [text, cover({ y: 18 })],
      [text, cover({ parent: 2 }), dialog],
      [text, cover({ position: 'fixed' }), dialog],
      [{ ...text, occluder: null }, cover()],
      [{ ...text, occluder: 9 }, cover()],
      [{ ...text, height: 0 }, cover()],
    ])
      expect(subjectsOf(textOcclusion, boxes)).toEqual([])
  })
})
