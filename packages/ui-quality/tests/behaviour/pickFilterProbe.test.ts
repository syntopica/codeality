import { describe, expect, it } from 'vitest'

import { pickFilterProbe } from '@/behaviour/pickFilterProbe.js'

describe('pickFilterProbe', () => {
  it('takes a word that only some rows contain', () => {
    expect(
      pickFilterProbe([
        '19/09/2026 Holded Technologies Vibra Lab',
        '17/09/2026 Holded Technologies Vibra Flow',
        '05/09/2026 Cloud Linux Vibra Lab',
        '01/09/2026 Shopify Vibra Lab',
      ]),
    ).toEqual({ token: 'Holded', rowIndex: 0 })
  })
  it('returns null when every word is shared by most rows', () => {
    expect(pickFilterProbe(['Total 12', 'Total 13'])).toBeNull()
  })
})
