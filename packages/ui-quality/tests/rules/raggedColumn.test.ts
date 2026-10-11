import { describe, expect, it } from 'vitest'

import { raggedColumn } from '@/rules/raggedColumn.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const main = elementBox({ id: 0, isMain: true, x: 0, width: 1440 })
const column = elementBox({
  id: 1,
  parent: 0,
  x: 120,
  width: 1200,
  height: 600,
  padding: [0, 0, 0, 0],
})
const heading = elementBox({
  id: 2,
  parent: 1,
  tag: 'h1',
  x: 120,
  y: 0,
  width: 896,
  height: 80,
  text: 'Lab review of the practice calls',
  lines: 2,
})
const statCard = elementBox({
  id: 3,
  parent: 1,
  x: 120,
  y: 100,
  width: 1200,
  height: 160,
  borderRadius: 12,
  padding: [16, 16, 16, 16],
  shadowBlur: 6,
})
const statText = elementBox({
  id: 4,
  parent: 3,
  x: 136,
  y: 116,
  width: 200,
  text: '42 calls',
})
const paragraph = (overrides: Parameters<typeof elementBox>[0]) =>
  elementBox({
    tag: 'p',
    x: 120,
    y: 280,
    width: 672,
    height: 96,
    text: 'Transcript',
    lines: 4,
    ...overrides,
  })

describe('raggedColumn', () => {
  it('reports a heading that stops short above a block filling the column', () => {
    const findings = raggedColumn(
      snapshotOf([main, column, heading, statCard, statText]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.message)).toEqual([
      'this block ends 304px (25%) short of the 1200px column that #e3 next to it fills; give the column one width',
    ])
  })
  it('reports a one-line note whose fill shows where it stops', () => {
    const note = elementBox({
      ...heading,
      lines: 1,
      width: 768,
      backgroundColor: [254, 243, 199, 1],
    })
    const findings = raggedColumn(
      snapshotOf([main, column, note, statCard, statText]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['#e2'])
  })
  it('reports prose capped at a measure under a full-width card', () => {
    const findings = raggedColumn(
      snapshotOf([
        main,
        column,
        paragraph({ id: 2, parent: 1, y: 0, height: 48 }),
        statCard,
        statText,
      ]),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.subject)).toEqual(['#e2'])
  })
  it('leaves prose at its measure beside a plain full-width block', () => {
    const plain = elementBox({
      id: 2,
      parent: 1,
      x: 120,
      y: 60,
      width: 1200,
      height: 40,
      text: 'Summary',
    })
    expect(
      raggedColumn(
        snapshotOf([main, column, plain, paragraph({ id: 3, parent: 1 })]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('ignores small shortfalls, centred blocks, rows of cards and empty fills', () => {
    const near = elementBox({ ...heading, width: 1100 })
    const centred = elementBox({ ...heading, x: 272 })
    const sideCard = elementBox({ ...heading, id: 5, x: 1036, width: 284 })
    const row = [main, column, heading, statCard, statText, sideCard]
    const fill = elementBox({ ...heading, text: '' })
    const oneLine = elementBox({ ...heading, lines: 1 })
    const table = elementBox({ ...heading, display: 'table' })
    for (const elements of [
      [main, column, near, statCard, statText],
      [main, column, centred, statCard, statText],
      row,
      [main, column, fill, statCard, statText],
      [main, column, oneLine, statCard, statText],
      [main, column, table, statCard, statText],
      [main, column, heading],
    ])
      expect(raggedColumn(snapshotOf(elements), ruleContext())).toEqual([])
  })
  it('judges only the main region', () => {
    const aside = elementBox({ ...column, parent: null })
    expect(
      raggedColumn(
        snapshotOf([main, aside, heading, statCard, statText]),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
