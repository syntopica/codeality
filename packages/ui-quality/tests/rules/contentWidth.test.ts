import { describe, expect, it } from 'vitest'

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

describe('contentWidth', () => {
  it('reports a narrow column at a wide viewport', () => {
    const findings = contentWidth(
      snapshotOf([main, column(1166)], { viewportWidth: 1920 }),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain(
      '1166px of the 1664px main region (70%',
    )
  })
  it('accepts a full column, a narrow viewport, no main and an empty main', () => {
    expect(
      contentWidth(
        snapshotOf([main, column(1600)], { viewportWidth: 1920 }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      contentWidth(
        snapshotOf([main, column(600)], { viewportWidth: 1024 }),
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
