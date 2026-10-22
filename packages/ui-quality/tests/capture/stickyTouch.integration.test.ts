import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { touchTarget } from '@/rules/touchTarget.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { STICKY_TOUCH_STATES } from './STICKY_TOUCH_STATES.js'
import { stickyTouchSetup } from './stickyTouchSetup.js'

describe('sticky table tap coverage', () => {
  it('clips confirmed coverage, retains exposed peers, and refuses unsupported paint', async () => {
    const browser = await chromium.launch({ headless: true, timeout: 15000 })
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 600 },
      })
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        await readFile(
          new URL('../fixtures/site/sticky-touch.html', import.meta.url),
          'utf8',
        ),
      )
      for (const state of STICKY_TOUCH_STATES) {
        await page.evaluate(stickyTouchSetup(state))
        const probe = await page.evaluate<ProbeResult>(
          `(${probeSource()})('main')`,
        )
        const row = probe.elements.find((box) => box.selector === 'button#row')
        const findings = touchTarget(
          snapshotOf(probe.elements, {
            screen: {
              route: '/',
              viewport: { width: 390, height: 600 },
              colorScheme: 'light',
            },
          }),
          ruleContext(),
        )
        const overlapping = findings
          .filter((finding) => finding.identity.startsWith('overlap'))
          .map((finding) => finding.subject)
        expect(Object.hasOwn(row ?? {}, 'tapOcclusion')).toBe(state.covered)
        const expected = state.covered
          ? { sort: state.headerOverlap ?? false, row: state.exposed }
          : state.scroll > 0
            ? { sort: true }
            : {}
        const hiddenHeader =
          state.style === 'visibility:hidden' ? { row: true } : {}
        expect({
          state,
          covered: row?.tapOcclusion !== undefined,
          sort: overlapping.includes('button#sort'),
          row: overlapping.includes('button#row'),
        }).toMatchObject({
          state,
          covered: state.covered,
          ...expected,
          ...hiddenHeader,
        })
      }
    } finally {
      await browser.close()
    }
  }, 45000)
})
