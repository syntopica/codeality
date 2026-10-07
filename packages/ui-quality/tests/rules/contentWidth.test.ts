import { describe, expect, it } from 'vitest'

import type { ElementBox } from '@/model/ElementBox.js'
import { contentWidth } from '@/rules/contentWidth.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const main = elementBox({
  id: 0,
  isMain: true,
  x: 256,
  width: 1664,
  selector: 'main',
})
const column = (width: number) =>
  elementBox({ id: 1, parent: 0, x: 500, width, text: 'Inbox' })
const table = elementBox({ id: 2, parent: 1, tag: 'table', x: 500 })
// Three children of the column, each with one part of its own; ids are
// snapshot indices.
const itemsOf = (part: Partial<ElementBox>): ElementBox[] =>
  [2, 4, 6].flatMap((id) => [
    elementBox({ id, parent: 1, x: 500 }),
    elementBox({ id: id + 1, parent: id, x: 500, ...part }),
  ])
const findingsAt1920 = (elements: ElementBox[]) =>
  contentWidth(snapshotOf(elements, { viewportWidth: 1920 }), ruleContext())

describe('contentWidth', () => {
  it('reports a narrow column at a wide viewport', () => {
    const findings = findingsAt1920([main, column(1166), table])
    expect(findings[0]?.message).toContain(
      '1166px of the 1664px main region (70%',
    )
  })
  it('reports a narrow list of rows', () => {
    expect(
      findingsAt1920([main, column(1166), ...itemsOf({ text: 'Invoice 12' })]),
    ).toHaveLength(1)
  })
  it('leaves a reading page and a single form at their measure', () => {
    expect(findingsAt1920([main, column(1166)])).toEqual([])
    expect(
      findingsAt1920([main, column(720), ...itemsOf({ textLength: 420 })]),
    ).toEqual([])
    expect(
      findingsAt1920([main, column(448), ...itemsOf({ isTextEntry: true })]),
    ).toEqual([])
  })
  it('accepts a full column, a narrow viewport, no main and an empty main', () => {
    expect(
      contentWidth(
        snapshotOf([main, column(1600), table], { viewportWidth: 1920 }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      contentWidth(
        snapshotOf([main, column(600), table], { viewportWidth: 1024 }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      contentWidth(
        snapshotOf([column(600)], { viewportWidth: 1920 }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      contentWidth(snapshotOf([main], { viewportWidth: 1920 }), ruleContext()),
    ).toEqual([])
  })
})
