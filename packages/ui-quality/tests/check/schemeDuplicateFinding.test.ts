import { describe, expect, it } from 'vitest'

import type { CapturedScreen } from '@/capture/CapturedScreen.js'
import { schemeDuplicateFinding } from '@/check/schemeDuplicateFinding.js'
import type { ColorScheme } from '@/model/ColorScheme.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const capture = (
  route: string,
  colorScheme: ColorScheme,
  screenshotDigest: string,
): CapturedScreen => ({
  route: {
    path: route,
    main: 'main',
    waitFor: null,
    localStorage: {},
    click: [],
    scroll: null,
    hover: null,
    focus: null,
  },
  snapshot: snapshotOf([], {
    screen: { route, viewport: { width: 1440, height: 900 }, colorScheme },
    screenshotDigest,
  }),
})

describe('schemeDuplicateFinding', () => {
  it('warns once when dark captures equal their light twins', () => {
    const finding = schemeDuplicateFinding([
      capture('/a', 'light', 'x'),
      capture('/b', 'light', 'y'),
      capture('/a', 'dark', 'x'),
      capture('/b', 'dark', 'y'),
    ])
    expect(finding?.rule).toBe('dark-scheme-ignored')
    expect(finding?.message).toContain('on 2 of 2 screens (/a, /b)')
  })
  it('stays quiet when dark differs or was not captured', () => {
    expect(
      schemeDuplicateFinding([
        capture('/a', 'light', 'x'),
        capture('/a', 'dark', 'z'),
      ]),
    ).toBeNull()
    expect(schemeDuplicateFinding([capture('/a', 'light', 'x')])).toBeNull()
  })
})
