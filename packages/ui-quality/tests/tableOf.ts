import type { ElementBox } from '@/model/ElementBox.js'
import { elementBox } from '@tests/elementBox.js'
import { TABLE_DEFAULTS } from '@tests/TABLE_DEFAULTS.js'
import type { TableSpec } from '@tests/TableSpec.js'

// table(0) > thead(1) > tr(2) > th(3..5); table > tbody > tr > td x3, each
// row at its own y so rows stack.
export const tableOf = (given: TableSpec): ElementBox[] => {
  const spec = { ...TABLE_DEFAULTS, ...given }
  const boxes: ElementBox[] = []
  const add = (overrides: Partial<ElementBox>): ElementBox => {
    const box = elementBox({ id: boxes.length, ...overrides })
    boxes.push(box)
    return box
  }
  const table = add({
    tag: 'table',
    selector: 'table.records',
    height: spec.rows * 40 + 40,
  })
  const head = add({ parent: table.id, tag: 'thead', signature: 'thead' })
  const headRow = add({
    parent: head.id,
    tag: 'tr',
    signature: 'tr.head',
    height: spec.headerHeight,
  })
  for (const name of ['Id', 'Account', 'Status'])
    add({
      parent: headRow.id,
      tag: 'th',
      text: name,
      textLength: name.length,
      position: spec.headerPosition,
    })
  const body = add({ parent: table.id, tag: 'tbody', signature: 'tbody' })
  let y = 100
  for (let index = 0; index < spec.rows; index++) {
    const height = spec.rowHeight(index)
    const row = add({
      parent: body.id,
      tag: 'tr',
      signature: 'tr',
      y,
      height,
    })
    y += height
    for (const column of [0, 1, 2]) {
      const text = column === 0 ? spec.firstCell(index) : 'Active'
      add({
        parent: row.id,
        tag: 'td',
        text,
        textLength: text.length,
        lines: spec.lines(index),
        y,
        height,
        selector: `td${String(index)}-${String(column)}`,
      })
    }
  }
  return boxes
}
