import { expect, it } from 'vitest'

import { offScaleSpacing } from '@/rules/offScaleSpacing.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

it('accepts the 6px, 10px and 14px half steps together', () => {
  const main = elementBox({ id: 0, tag: 'main', isMain: true })
  const boxes = [6, 10, 14].map((value, index) =>
    elementBox({
      id: index + 1,
      parent: 0,
      padding: [value, value, value, value],
    }),
  )
  expect(offScaleSpacing(snapshotOf([main, ...boxes]), ruleContext())).toEqual(
    [],
  )
})
