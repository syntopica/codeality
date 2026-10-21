import { describe, expect, it } from 'vitest'

import { raggedColumn } from '@/rules/raggedColumn.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('raggedColumn wrapping evidence', () => {
  it.each([
    {
      name: 'a constrained wrapping child',
      childWidth: 300,
      lines: 2,
      expected: 0,
    },
    {
      name: 'a child wrapping at the block content edge',
      childWidth: 864,
      lines: 2,
      expected: 1,
    },
    {
      name: 'a one-line self-start heading',
      childWidth: 300,
      lines: 1,
      expected: 0,
    },
    {
      name: 'single-line text overflowing its box',
      childWidth: 300,
      lines: 1,
      expected: 0,
    },
    {
      name: 'a bordered block with a narrow child',
      childWidth: 300,
      lines: 2,
      expected: 1,
    },
    {
      name: 'a shadowed block with a narrow child',
      childWidth: 300,
      lines: 2,
      expected: 1,
    },
    {
      name: 'a filled block with a narrow child',
      childWidth: 300,
      lines: 2,
      expected: 1,
    },
  ])('$name', ({ name, childWidth, lines, expected }) => {
    const main = elementBox({ id: 0, isMain: true, width: 1440 })
    const column = elementBox({
      id: 1,
      parent: 0,
      x: 120,
      width: 1200,
      height: 600,
    })
    const block = elementBox({
      id: 2,
      parent: 1,
      x: 120,
      width: 896,
      height: 80,
      padding: [16, 16, 16, 16],
      contentWidth: 864,
      borderWidths: name.includes('bordered') ? [1, 1, 1, 1] : [0, 0, 0, 0],
      borderColors: [
        [20, 40, 80, 1],
        [20, 40, 80, 1],
        [20, 40, 80, 1],
        [20, 40, 80, 1],
      ],
      shadowBlur: name.includes('shadowed') ? 6 : 0,
      backgroundColor: name.includes('filled')
        ? [254, 243, 199, 1]
        : [0, 0, 0, 0],
    })
    const heading = elementBox({
      id: 3,
      parent: 2,
      tag: 'h2',
      selector: 'h2.self-start',
      x: 136,
      y: 16,
      width: childWidth,
      clientWidth: childWidth,
      contentWidth: childWidth,
      height: lines * 24,
      contentHeight: lines * 24,
      lines,
      text: 'Synthetic section heading',
      textLeft: 136,
      textRight: name.includes('overflowing') ? 636 : 136 + childWidth - 8,
      scrollWidth: name.includes('overflowing') ? 500 : childWidth,
    })
    const card = elementBox({
      id: 4,
      parent: 1,
      x: 120,
      y: 100,
      width: 1200,
      height: 160,
      shadowBlur: 6,
    })
    const cardText = elementBox({
      id: 5,
      parent: 4,
      x: 136,
      y: 116,
      text: '42 calls',
    })
    const findings = raggedColumn(
      snapshotOf([main, column, block, heading, card, cardText]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(
      expected ? ['#e2'] : [],
    )
  })
})
