import { describe, expect, it } from 'vitest'

import { redundantColumn } from '@/rules/redundantColumn.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { tableOf } from '@tests/tableOf.js'
import { withPageBox } from '@tests/withPageBox.js'

const COMPANY = 'VeoPlan ESPJ'

const run = (
  boxes: ReturnType<typeof tableOf>,
): ReturnType<typeof redundantColumn> =>
  redundantColumn(snapshotOf(boxes), ruleContext())

describe('redundantColumn', () => {
  it('reports a column repeating the value of a company picker', () => {
    const findings = run(
      withPageBox(tableOf({ rows: 5, firstCell: () => COMPANY }), {
        role: 'combobox',
        text: COMPANY,
      }),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain(COMPANY)
  })
  it('reports a column repeating a breadcrumb item', () => {
    const crumbs = withPageBox(tableOf({ rows: 5, firstCell: () => COMPANY }), {
      tag: 'nav',
      label: 'Breadcrumb',
    })
    const withCrumb = withPageBox(crumbs, {
      parent: crumbs.length - 1,
      text: COMPANY,
    })
    expect(run(withCrumb)).toHaveLength(1)
  })
  it('accepts a column that varies, a value the page does not show and a short table', () => {
    const picker = { role: 'combobox', text: COMPANY }
    expect(
      run(
        withPageBox(
          tableOf({ rows: 5, firstCell: (i) => `${COMPANY} ${String(i)}` }),
          picker,
        ),
      ),
    ).toEqual([])
    expect(
      run(
        withPageBox(tableOf({ rows: 5, firstCell: () => COMPANY }), {
          role: 'combobox',
          text: 'Other',
        }),
      ),
    ).toEqual([])
    expect(
      run(withPageBox(tableOf({ rows: 3, firstCell: () => COMPANY }), picker)),
    ).toEqual([])
  })
})
