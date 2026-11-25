import { describe, expect, it } from 'vitest'

import { touchTarget } from '@/rules/touchTarget.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const tap = (
  id: number,
  overrides: Partial<Parameters<typeof elementBox>[0]> = {},
) =>
  elementBox({
    tag: 'button',
    tappable: true,
    width: 48,
    height: 48,
    tapWidth: 48,
    tapHeight: 48,
    signature: `button.b${String(id)}`,
    x: id * 100,
    ...overrides,
    id,
  })

const screenAt = (width: number) => ({
  screen: {
    route: '/inbox',
    viewport: { width, height: 844 },
    colorScheme: 'light' as const,
  },
})
const phone = screenAt(390)
const subjectsOf = (
  elements: ReturnType<typeof tap>[],
  overrides: Parameters<typeof snapshotOf>[1] = phone,
): string[] =>
  touchTarget(snapshotOf(elements, overrides), ruleContext()).map(
    (finding) => finding.subject,
  )

describe('touchTarget', () => {
  it('reports a target under 44px on a side and takes the extended hit area into account', () => {
    expect(
      subjectsOf([
        tap(0, { selector: 'button.small', tapWidth: 32, tapHeight: 32 }),
        tap(1, { selector: 'button.wide', tapWidth: 80, tapHeight: 43 }),
        tap(2, { selector: 'button.padded', width: 32, tapWidth: 48 }),
      ]),
    ).toEqual(['button.small', 'button.wide'])
  })
  it('stays quiet above the phone width', () => {
    expect(
      subjectsOf([tap(0, { tapWidth: 20, tapHeight: 20 })], screenAt(1440)),
    ).toEqual([])
  })
  it('exempts links inside a sentence, disabled controls and parked skip links', () => {
    const para = elementBox({ id: 0, tag: 'p', text: 'See the terms.' })
    expect(
      subjectsOf([
        para,
        tap(1, {
          tag: 'a',
          parent: 0,
          display: 'inline',
          tapWidth: 60,
          tapHeight: 20,
        }),
        tap(2, { disabled: true, tapWidth: 20, tapHeight: 20 }),
        tap(3, { x: -400, width: 100, tapWidth: 100, tapHeight: 20 }),
      ]),
    ).toEqual([])
  })
  it('keeps a bare nav link, which is inline but has no text around it', () => {
    const item = elementBox({ id: 0, tag: 'li' })
    expect(
      subjectsOf([
        item,
        tap(1, {
          tag: 'a',
          parent: 0,
          display: 'inline',
          selector: 'li > a',
          tapWidth: 90,
          tapHeight: 22,
        }),
      ]),
    ).toEqual(['li > a'])
  })
  it('reports targets that cross each other but not a stretched link over its card', () => {
    expect(
      subjectsOf([
        tap(0, { selector: 'button.a', x: 0, width: 120 }),
        tap(1, { selector: 'button.b', x: 96, width: 120 }),
        tap(2, {
          selector: 'a.card',
          x: 400,
          width: 300,
          height: 200,
          tapWidth: 300,
          tapHeight: 200,
        }),
        tap(3, { selector: 'button.in-card', x: 420, width: 100 }),
      ]),
    ).toEqual(['button.a'])
  })

  it('lets a row scroll out from under a tab bar fixed to the bottom, not from under a top bar', () => {
    const ROW = 'button.row'
    const bar = elementBox({
      id: 2,
      tag: 'nav',
      position: 'fixed',
      y: 788,
      width: 390,
      height: 56,
    })
    const tab = tap(1, { selector: 'button.tab', x: 0, y: 788, parent: 2 })
    const row = tap(0, { selector: ROW, x: 20, y: 770 })
    const tall = { ...phone, viewportHeight: 844, documentHeight: 1200 }
    expect(subjectsOf([row, tab, bar], tall)).toEqual([])
    expect(
      subjectsOf([row, tab, bar], { ...tall, documentHeight: 844 }),
    ).toEqual([ROW])
    const topTab = { ...tab, y: 0 }
    const topBar = { ...bar, y: 0 }
    const under = tap(0, { selector: ROW, x: 20, y: 10 })
    expect(subjectsOf([under, topTab, topBar], tall)).toEqual([ROW])
  })
})

describe('touchTarget under a modal dialog', () => {
  const dialog = () =>
    elementBox({
      id: 1,
      tag: 'div',
      isDialog: true,
      isModal: true,
      width: 390,
      height: 844,
    })
  const inDialog = (id: number, x: number) => tap(id, { parent: 1, x, y: 0 })

  it('skips a page target the modal covers', () => {
    expect(
      subjectsOf([tap(0, { x: 0, y: 0 }), dialog(), inDialog(2, 20)]),
    ).toEqual([])
  })
  it('still reports two targets inside the dialog that cross', () => {
    expect(
      subjectsOf([
        elementBox({ id: 0 }),
        dialog(),
        inDialog(2, 0),
        inDialog(3, 20),
      ]),
    ).toEqual(['#e2'])
  })
})
