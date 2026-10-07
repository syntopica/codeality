import { describe, expect, it } from 'vitest'

import { placeholderFit } from '@/rules/placeholderFit.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const field = (placeholderWidth: number) =>
  elementBox({ id: 0, tag: 'input', contentWidth: 200, placeholderWidth })

describe('placeholderFit', () => {
  it('reports a placeholder over 20% wider than its field', () => {
    expect(
      placeholderFit(snapshotOf([field(260)]), ruleContext())[0]?.message,
    ).toContain('needs 260px and the field shows 200px')
  })
  it('accepts a fitting placeholder, a slight overflow and no placeholder', () => {
    for (const width of [180, 230, 0])
      expect(placeholderFit(snapshotOf([field(width)]), ruleContext())).toEqual(
        [],
      )
  })
})
