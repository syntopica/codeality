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
  width: 1104,
  height: 600,
  padding: [0, 0, 0, 0],
})
const title = elementBox({
  id: 2,
  parent: 1,
  tag: 'h1',
  x: 120,
  width: 300,
  height: 40,
  text: 'Settings',
  lines: 1,
})
const card = elementBox({
  id: 3,
  parent: 1,
  x: 120,
  y: 60,
  width: 672,
  height: 200,
  borderWidths: [1, 1, 1, 1],
  borderColors: Array<[number, number, number, number]>(4).fill([
    200, 200, 200, 1,
  ]) as never,
  borderRadius: 12,
  maxWidth: 672,
})
const cardText = elementBox({
  id: 4,
  parent: 3,
  x: 136,
  y: 76,
  width: 200,
  text: 'Name',
  lines: 1,
})
const run = (...boxes: ReturnType<typeof elementBox>[]) =>
  raggedColumn(snapshotOf([main, column, title, ...boxes]), ruleContext())

describe('raggedColumn with a max-width cap', () => {
  it('reports a lone card capped far inside its column', () => {
    expect(run(card, cardText).map((finding) => finding.message)).toEqual([
      'this block ends 432px (39%) short of the 1104px column because of its max-width of 672px; remove the cap or let the content fill the column',
    ])
  })
  it('reports a capped paragraph with no neighbour', () => {
    const paragraph = elementBox({
      id: 3,
      parent: 1,
      tag: 'p',
      x: 120,
      y: 60,
      width: 672,
      height: 72,
      text: 'Intro',
      lines: 3,
      maxWidth: 672,
    })
    expect(run(paragraph).map((finding) => finding.subject)).toEqual(['#e3'])
  })
  it('leaves a centred capped form alone', () => {
    const centred = elementBox({ ...card, x: 336 })
    expect(run(centred, cardText)).toEqual([])
  })
  it('leaves a capped image alone', () => {
    const image = elementBox({ ...card, tag: 'img' })
    expect(run(image)).toEqual([])
  })
  it('leaves a block sized by its content below its max-width alone', () => {
    const sized = elementBox({ ...card, width: 400 })
    expect(run(sized, cardText)).toEqual([])
  })
  it('leaves a block whose cap is not set alone', () => {
    const uncapped = elementBox({ ...card, maxWidth: null })
    expect(run(uncapped, cardText)).toEqual([])
  })
})
