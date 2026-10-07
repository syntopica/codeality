import { describe, expect, it } from 'vitest'

import { idFirstColumn } from '@/rules/idFirstColumn.js'
import { rowHeightScale } from '@/rules/rowHeightScale.js'
import { stickyTableHeader } from '@/rules/stickyTableHeader.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { tableOf } from '@tests/tableOf.js'

const UUID = '3f2b8c1e-9a4d-4e7b-8f10-2d5c6a7b8e90'

describe('idFirstColumn', () => {
  it('reports a first column of UUIDs or long tokens in a table of more than five rows', () => {
    const findings = idFirstColumn(
      snapshotOf(tableOf({ rows: 8, firstCell: () => UUID })),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(
      idFirstColumn(
        snapshotOf(
          tableOf({ rows: 8, firstCell: () => 'a1b2c3d4e5f6a1b2c3d4e5f6' }),
        ),
        ruleContext(),
      ),
    ).toHaveLength(1)
  })
  it('accepts names, short numbers, a mostly-named column and short tables', () => {
    for (const spec of [
      { rows: 8, firstCell: () => 'Acme' },
      { rows: 8, firstCell: () => '#10432' },
      { rows: 8, firstCell: (index: number) => (index < 5 ? UUID : 'Acme') },
      { rows: 5, firstCell: () => UUID },
    ])
      expect(idFirstColumn(snapshotOf(tableOf(spec)), ruleContext())).toEqual(
        [],
      )
  })
})

describe('stickyTableHeader', () => {
  it('reports a table taller than 1.5 viewports whose header does not stick', () => {
    expect(
      stickyTableHeader(snapshotOf(tableOf({ rows: 40 })), ruleContext()),
    ).toHaveLength(1)
  })
  it('accepts a sticky header, and a table that fits the screen', () => {
    expect(
      stickyTableHeader(
        snapshotOf(tableOf({ rows: 40, headerPosition: 'sticky' })),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      stickyTableHeader(snapshotOf(tableOf({ rows: 10 })), ruleContext()),
    ).toEqual([])
  })
})

describe('rowHeightScale', () => {
  it('reports body rows that differ by more than 2px', () => {
    const findings = rowHeightScale(
      snapshotOf(tableOf({ rows: 6, rowHeight: (i) => (i === 2 ? 56 : 40) })),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain('40px to 56px')
  })
  it('reports a header row more than 8px off the body rows', () => {
    const findings = rowHeightScale(
      snapshotOf(tableOf({ rows: 6, headerHeight: 64 })),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain('header row is 64px')
  })
  it('leaves rows that wrap by design, a 2px spread and a 5px header difference alone', () => {
    expect(
      rowHeightScale(
        snapshotOf(
          tableOf({
            rows: 6,
            rowHeight: (i) => (i === 2 ? 72 : 40),
            lines: (i) => (i === 2 ? 3 : 1),
          }),
        ),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      rowHeightScale(
        snapshotOf(
          tableOf({
            rows: 6,
            rowHeight: (i) => (i === 2 ? 42 : 40),
            headerHeight: 45,
          }),
        ),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
