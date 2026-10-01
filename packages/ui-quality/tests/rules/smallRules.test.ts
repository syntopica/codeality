import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { axeFindings } from '@/rules/axeFindings.js'
import { blankRoute } from '@/rules/blankRoute.js'
import { horizontalOverflow } from '@/rules/horizontalOverflow.js'
import { runRules } from '@/rules/runRules.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('blankRoute, horizontalOverflow and axeFindings', () => {
  it('reports a missing or empty main region', () => {
    expect(blankRoute(snapshotOf([]), ruleContext())[0]?.identity).toBe(
      'no-main',
    )
    const main = elementBox({ id: 0, isMain: true })
    expect(blankRoute(snapshotOf([main]), ruleContext())[0]?.identity).toBe(
      'empty-main',
    )
    const text = elementBox({ id: 1, parent: 0, text: 'hi' })
    expect(blankRoute(snapshotOf([main, text]), ruleContext())).toEqual([])
  })
  it('reports a page wider than its viewport', () => {
    expect(
      horizontalOverflow(
        snapshotOf([], { documentWidth: 500, viewportWidth: 390 }),
        ruleContext(),
      ),
    ).toHaveLength(1)
    expect(horizontalOverflow(snapshotOf([]), ruleContext())).toEqual([])
  })
  it('turns each axe violation into one finding, blocking on serious impact', () => {
    const axe = [
      {
        id: 'color-contrast',
        impact: 'serious',
        help: 'Contrast',
        nodes: [
          { target: 'span', summary: '1.1:1' },
          { target: 'b', summary: '' },
        ],
      },
      { id: 'region', impact: 'moderate', help: 'Landmarks', nodes: [] },
    ]
    const findings = axeFindings(snapshotOf([], { axe }), ruleContext())
    expect(findings.map((finding) => [finding.rule, finding.severity])).toEqual(
      [
        ['a11y/color-contrast', 'error'],
        ['a11y/region', 'warn'],
      ],
    )
    expect(findings[0]?.message).toContain('2 element(s); e.g. 1.1:1')
  })
  it('runs every rule and groups repeats of one identity', () => {
    const config = configFromDocument({
      baseUrl: 'http://x',
      routes: ['/inbox'],
    })
    const route = config.routes[0]
    if (!route) throw new Error('route missing')
    const clipped = (id: number) =>
      elementBox({
        id,
        text: 'cut',
        overflowX: 'hidden',
        scrollWidth: 300,
        clientWidth: 100,
        selector: 'p.cut',
      })
    const findings = runRules(
      snapshotOf([clipped(0), clipped(1)]),
      route,
      config,
    )
    const cut = findings.find((finding) => finding.rule === 'text-clipped')
    expect(cut?.message).toContain('(and 1 more like it)')
    expect(findings.some((finding) => finding.rule === 'blank-route')).toBe(
      true,
    )
  })
})
