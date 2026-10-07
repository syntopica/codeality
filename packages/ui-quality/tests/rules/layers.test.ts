import { clippedPopover } from '@/rules/clippedPopover.js'
import { zIndexSprawl } from '@/rules/zIndexSprawl.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

describe('clippedPopover', () => {
  const clip = (overrides = {}) =>
    elementBox({
      id: 0,
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'hidden',
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      selector: 'div.wrap',
      ...overrides,
    })
  const menu = (overrides = {}) =>
    elementBox({
      id: 1,
      parent: 0,
      role: 'menu',
      position: 'absolute',
      x: 0,
      y: 44,
      width: 200,
      height: 80,
      selector: 'ul.menu',
      ...overrides,
    })
  it('reports a menu that reaches past the box that clips it', () => {
    const findings = clippedPopover(snapshotOf([clip(), menu()]), ruleContext())
    expect(findings.map((finding) => finding.subject)).toEqual(['ul.menu'])
  })
  it('accepts a menu that fits, an unclipped box and other roles or positions', () => {
    const fits = menu({ y: 4, height: 30 })
    expect(clippedPopover(snapshotOf([clip(), fits]), ruleContext())).toEqual(
      [],
    )
    expect(
      clippedPopover(
        snapshotOf([
          clip({ overflowX: 'visible', overflowY: 'visible' }),
          menu(),
        ]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      clippedPopover(snapshotOf([clip(), menu({ role: '' })]), ruleContext()),
    ).toEqual([])
    expect(
      clippedPopover(
        snapshotOf([clip(), menu({ position: 'fixed' })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('ignores a clip above the containing block', () => {
    const outer = clip({ position: 'static' })
    const block = elementBox({
      id: 1,
      parent: 0,
      position: 'relative',
      width: 400,
      height: 400,
    })
    expect(
      clippedPopover(
        snapshotOf([outer, block, menu({ id: 2, parent: 1 })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('zIndexSprawl', () => {
  const layer = (id: number, zIndex: number, overrides = {}) =>
    elementBox({
      id,
      position: 'relative',
      zIndex,
      signature: `div.z${String(id)}`,
      ...overrides,
    })
  it('reports seven distinct layers once, and a value past the ceiling', () => {
    const boxes = [1, 2, 3, 4, 5, 6, 7].map((value, index) =>
      layer(index, value),
    )
    expect(zIndexSprawl(snapshotOf(boxes), ruleContext())).toHaveLength(1)
    const huge = zIndexSprawl(snapshotOf([layer(0, 9999)]), ruleContext())
    expect(huge).toHaveLength(1)
    expect(huge[0]?.message).toContain('9999')
  })
  it('accepts six layers, a raised ceiling and z-index that does not apply', () => {
    const six = [1, 2, 3, 4, 5, 6].map((value, index) => layer(index, value))
    expect(zIndexSprawl(snapshotOf(six), ruleContext())).toEqual([])
    const options = {
      ...ruleContext().options,
      zIndexSprawl: { maxLayers: 6, ceiling: 10_000 },
    }
    expect(
      zIndexSprawl(snapshotOf([layer(0, 9999)]), ruleContext({ options })),
    ).toEqual([])
    expect(
      zIndexSprawl(
        snapshotOf([layer(0, 9999, { position: 'static' })]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(zIndexSprawl(snapshotOf([layer(0, -1)]), ruleContext())).toEqual([])
  })
  it('counts a flex item whose z-index applies without a position', () => {
    const row = elementBox({ id: 0, display: 'flex' })
    const item = layer(1, 5000, { parent: 0, position: 'static' })
    expect(zIndexSprawl(snapshotOf([row, item]), ruleContext())).toHaveLength(1)
  })
})
