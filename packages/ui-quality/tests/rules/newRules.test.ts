import { describe, expect, it } from 'vitest'

import { contrastRatio } from '@/color/contrastRatio.js'
import { bareUrl } from '@/rules/bareUrl.js'
import { fixedOverflow } from '@/rules/fixedOverflow.js'
import { iconContrast } from '@/rules/iconContrast.js'
import { rawPlaceholder } from '@/rules/rawPlaceholder.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('fixedOverflow', () => {
  const sidebar = (overrides: Parameters<typeof elementBox>[0]) =>
    elementBox({
      position: 'fixed',
      height: 900,
      clientHeight: 900,
      scrollHeight: 1024,
      ...overrides,
    })
  it('reports a pinned sidebar taller than the window', () => {
    const findings = fixedOverflow(
      snapshotOf([sidebar({ id: 0 })]),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain('the last 124px are unreachable')
  })
  it('accepts a scrolling sidebar, one that fits and a static column', () => {
    const fits = [
      sidebar({ id: 0, overflowY: 'auto' }),
      sidebar({ id: 1, scrollHeight: 900 }),
      sidebar({ id: 2, position: 'static' }),
    ]
    expect(fixedOverflow(snapshotOf(fits), ruleContext())).toEqual([])
  })
})

describe('iconContrast', () => {
  const header = elementBox({ id: 0, backgroundColor: [255, 255, 255, 1] })
  const button = elementBox({ id: 1, parent: 0, tag: 'button' })
  const bell = (color: [number, number, number, number]) =>
    elementBox({ id: 2, parent: 1, tag: 'svg', color })
  it('reports a pale icon-only button', () => {
    const findings = iconContrast(
      snapshotOf([header, button, bell([156, 163, 175, 1])]),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain('2.54:1')
  })
  it('accepts a dark icon, a labelled control and an icon outside a control', () => {
    expect(
      iconContrast(
        snapshotOf([header, button, bell([75, 85, 99, 1])]),
        ruleContext(),
      ),
    ).toEqual([])
    const label = elementBox({ id: 3, parent: 1, text: 'Alerts' })
    expect(
      iconContrast(
        snapshotOf([header, button, bell([156, 163, 175, 1]), label]),
        ruleContext(),
      ),
    ).toEqual([])
    const loose = elementBox({
      id: 1,
      parent: 0,
      tag: 'svg',
      color: [230, 230, 230, 1],
    })
    expect(iconContrast(snapshotOf([header, loose]), ruleContext())).toEqual([])
  })
  it('measures a translucent icon over a white canvas', () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21)
    const ghost = elementBox({ id: 0, tag: 'button' })
    const icon = elementBox({
      id: 1,
      parent: 0,
      tag: 'svg',
      color: [0, 0, 0, 0.2],
    })
    expect(iconContrast(snapshotOf([ghost, icon]), ruleContext())).toHaveLength(
      1,
    )
  })
})

describe('rawPlaceholder', () => {
  it('reports a bracketed lower-case stand-in and accepts copy', () => {
    const elements = [
      elementBox({ id: 0, text: '[media message]' }),
      elementBox({ id: 1, text: '[Contacto] Nueva reserva' }),
      elementBox({ id: 2, text: '[VIBRA LAB S.L.]' }),
    ]
    const findings = rawPlaceholder(snapshotOf(elements), ruleContext())
    expect(findings.map((finding) => finding.subject)).toEqual(['#e0'])
  })
})

describe('bareUrl', () => {
  it('reports an address in plain text and accepts one inside a link', () => {
    const elements = [
      elementBox({
        id: 0,
        tag: 'p',
        text: 'Mira https://example.com/artistas',
      }),
      elementBox({ id: 1, tag: 'a', text: 'https://example.com' }),
      elementBox({ id: 2, tag: 'a' }),
      elementBox({
        id: 3,
        parent: 2,
        tag: 'span',
        text: 'https://example.com/x',
      }),
      elementBox({ id: 4, tag: 'p', text: 'no address here' }),
    ]
    const findings = bareUrl(snapshotOf(elements), ruleContext())
    expect(findings.map((finding) => finding.subject)).toEqual(['#e0'])
  })
})
