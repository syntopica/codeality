import { describe, expect, it } from 'vitest'

import { edgeMisaligned } from '@/rules/edgeMisaligned.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const banner = elementBox({ id: 0, isBanner: true, x: 256, width: 1664 })
const main = elementBox({ id: 1, isMain: true, x: 256, width: 1664 })
const search = elementBox({
  id: 2,
  parent: 0,
  x: 288,
  width: 576,
  isControl: true,
})
const account = elementBox({
  id: 3,
  parent: 0,
  x: 1700,
  width: 188,
  text: 'info@',
})
const list = (x: number, width: number) =>
  elementBox({ id: 4, parent: 1, x, width, text: 'Inbox' })

describe('edgeMisaligned', () => {
  it('reports a header and a centred column that nearly line up', () => {
    const findings = edgeMisaligned(
      snapshotOf([banner, main, search, account, list(352, 1472)], {
        viewportWidth: 1920,
      }),
      ruleContext(),
    )
    expect(findings[0]?.message).toBe(
      'header and main content edges differ by 64px on the left and 64px on the right at 1920px; put both on the same container',
    )
  })
  it('ignores full-bleed section bands and drawers fixed over the page', () => {
    const band = elementBox({
      id: 5,
      parent: 1,
      x: 256,
      width: 1664,
      backgroundColor: [240, 244, 250, 1],
    })
    const drawer = elementBox({
      id: 6,
      parent: 1,
      x: 1200,
      width: 720,
      position: 'fixed',
    })
    const drawerText = elementBox({
      id: 7,
      parent: 6,
      x: 1220,
      width: 680,
      text: 'Invoice',
    })
    expect(
      edgeMisaligned(
        snapshotOf([
          banner,
          main,
          search,
          account,
          list(288, 1600),
          band,
          drawer,
          drawerText,
        ]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('ignores a contentless ornament positioned past the content edge', () => {
    const ornament = elementBox({
      id: 5,
      parent: 1,
      x: 1744,
      width: 160,
      backgroundColor: [37, 99, 235, 0.2],
      position: 'absolute',
    })
    expect(
      edgeMisaligned(
        snapshotOf([banner, main, search, account, list(288, 1600), ornament]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('measures a wide table only as far as its scrolling frame shows it', () => {
    const frame = elementBox({
      id: 4,
      parent: 1,
      x: 288,
      width: 1600,
      overflowX: 'auto',
    })
    const table = elementBox({
      id: 5,
      parent: 4,
      x: 288,
      width: 1720,
      text: 'Total',
    })
    expect(
      edgeMisaligned(
        snapshotOf([banner, main, search, account, frame, table]),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('accepts shared edges, deliberate offsets and pages without a header', () => {
    expect(
      edgeMisaligned(
        snapshotOf([banner, main, search, account, list(288, 1600)]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      edgeMisaligned(
        snapshotOf([banner, main, search, account, list(800, 300)]),
        ruleContext(),
      ),
    ).toEqual([])
    expect(
      edgeMisaligned(snapshotOf([main, list(352, 1472)]), ruleContext()),
    ).toEqual([])
    expect(edgeMisaligned(snapshotOf([banner, main]), ruleContext())).toEqual(
      [],
    )
  })
})
