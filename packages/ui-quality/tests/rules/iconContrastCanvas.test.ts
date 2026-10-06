import { describe, expect, it } from 'vitest'

import { iconContrast } from '@/rules/iconContrast.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('iconContrast on the page canvas', () => {
  it('measures against a page colour painted on body, not white', () => {
    const ghost = elementBox({ id: 0, tag: 'button' })
    const pale = elementBox({
      id: 1,
      parent: 0,
      tag: 'svg',
      color: [226, 232, 240, 1],
    })
    expect(
      iconContrast(
        snapshotOf([ghost, pale], {
          rootBackgrounds: [
            { color: null, hasImage: false },
            { color: [15, 23, 42, 1], hasImage: false },
          ],
        }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(iconContrast(snapshotOf([ghost, pale]), ruleContext())).toHaveLength(
      1,
    )
  })
  it('skips an icon over a body gradient with no solid fill between', () => {
    const ghost = elementBox({ id: 0, tag: 'button' })
    const pale = elementBox({
      id: 1,
      parent: 0,
      tag: 'svg',
      color: [226, 232, 240, 1],
    })
    expect(
      iconContrast(
        snapshotOf([ghost, pale], {
          rootBackgrounds: [
            { color: [255, 255, 255, 1], hasImage: false },
            { color: [0, 0, 0, 0], hasImage: true },
          ],
        }),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
