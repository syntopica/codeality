import { darkSchemeIncomplete } from '@/rules/darkSchemeIncomplete.js'
import { pageScrollThread } from '@/rules/pageScrollThread.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

describe('darkSchemeIncomplete', () => {
  const dark = {
    screen: {
      route: '/x',
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark' as const,
    },
  }
  const roots = [
    {
      color: [17, 24, 39, 1] as [number, number, number, number],
      hasImage: false,
    },
  ]
  const select = elementBox({
    id: 0,
    tag: 'select',
    isControl: true,
    backgroundColor: [255, 255, 255, 1],
  })
  it('reports a dark page with no color-scheme, a light native field and no theme-color', () => {
    const findings = darkSchemeIncomplete(
      snapshotOf([select], { ...dark, rootBackgrounds: roots }),
      ruleContext(),
    )
    expect(findings.map((finding) => finding.identity)).toEqual([
      'color-scheme',
      'field:div',
      'theme-color',
    ])
  })
  it('accepts a complete dark page, a light page and the light capture', () => {
    const dim = elementBox({
      id: 0,
      tag: 'select',
      isControl: true,
      backgroundColor: [31, 41, 55, 1],
    })
    expect(
      darkSchemeIncomplete(
        snapshotOf([dim], {
          ...dark,
          rootBackgrounds: roots,
          rootColorScheme: 'light dark',
          hasThemeColor: true,
        }),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      darkSchemeIncomplete(snapshotOf([select], dark), ruleContext()),
    ).toEqual([])
    expect(
      darkSchemeIncomplete(
        snapshotOf([select], { rootBackgrounds: roots }),
        ruleContext(),
      ),
    ).toEqual([])
  })
})

describe('pageScrollThread', () => {
  const thread = (overrides = {}) =>
    elementBox({ id: 0, live: true, selector: 'div.log', ...overrides })
  const items = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      elementBox({ id: index + 1, parent: 0 }),
    )
  const tall = { documentHeight: 4000 }
  it('reports a long live region that grows a tall page', () => {
    expect(
      pageScrollThread(
        snapshotOf([thread(), ...items(30)], tall),
        ruleContext(),
      ),
    ).toHaveLength(1)
  })
  it('accepts a scrolling pane, a short page, a short thread and a scrolling ancestor', () => {
    expect(
      pageScrollThread(
        snapshotOf([thread({ overflowY: 'auto' }), ...items(30)], tall),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      pageScrollThread(snapshotOf([thread(), ...items(30)]), ruleContext()),
    ).toEqual([])
    expect(
      pageScrollThread(
        snapshotOf([thread(), ...items(10)], tall),
        ruleContext(),
      ),
    ).toEqual([])
    const pane = elementBox({ id: 0, overflowY: 'scroll' })
    const log = thread({ id: 1, parent: 0 })
    const rows = Array.from({ length: 30 }, (_, index) =>
      elementBox({ id: index + 2, parent: 1 }),
    )
    expect(
      pageScrollThread(snapshotOf([pane, log, ...rows], tall), ruleContext()),
    ).toEqual([])
  })
})
