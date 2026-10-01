import { describe, expect, it } from 'vitest'

import { inputZoom } from '@/rules/inputZoom.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const field = (id: number, fontSize: number) =>
  elementBox({
    id,
    tag: 'textarea',
    selector: `textarea#f${String(id)}`,
    isControl: true,
    isTextEntry: true,
    fontSize,
  })

describe('inputZoom', () => {
  it('reports fields under 16px on a phone viewport', () => {
    const findings = inputZoom(
      snapshotOf([field(0, 14), field(1, 16), field(2, 12)], {
        viewportWidth: 390,
      }),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.message).toContain(
      '2 fields set text under 16px (14px on textarea#f0)',
    )
  })
  it('accepts 16px fields, desktop viewports and small text that is not a field', () => {
    const label = elementBox({ id: 1, text: 'Etiqueta', fontSize: 12 })
    expect(
      inputZoom(
        snapshotOf([field(0, 16), label], { viewportWidth: 390 }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      inputZoom(
        snapshotOf([field(0, 14)], { viewportWidth: 1440 }),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
