import { describe, expect, it } from 'vitest'

import { disableEntriesFrom } from '@/config/disableEntriesFrom.js'
import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'

describe('disableEntriesFrom', () => {
  it('accepts objects with a code and a reason', () => {
    expect(
      disableEntriesFrom([{ code: 'BDB001', reason: 'documented' }], 2),
    ).toEqual([{ code: 'BDB001', reason: 'documented' }])
  })
  it('carries strings over under schemaVersion 1 with the legacy reason', () => {
    expect(disableEntriesFrom(['BDB001'], 1)).toEqual([
      { code: 'BDB001', reason: LEGACY_DISABLE_REASON },
    ])
  })
  it('rejects a string under schemaVersion 2 and shows the object form', () => {
    expect(() => disableEntriesFrom(['BDB001'], 2)).toThrow(
      /disable entries must be \{ "code": "BDB001", "reason": "why" \}/,
    )
  })
  it('rejects an empty reason and a missing code', () => {
    expect(() =>
      disableEntriesFrom([{ code: 'BDB001', reason: '' }], 2),
    ).toThrow(/reason must not be empty/)
    expect(() => disableEntriesFrom([{ reason: 'x' }], 2)).toThrow(
      /code must be a string/,
    )
    expect(() => disableEntriesFrom('BDB001', 2)).toThrow(
      /disable must be a list/,
    )
  })
})
