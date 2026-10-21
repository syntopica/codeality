import { readFile } from 'node:fs/promises'

import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { textCramped } from '@/rules/textCramped.js'
import { textOcclusion } from '@/rules/textOcclusion.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('sticky pager text measurements', () => {
  it('distinguishes recoverable coverage, a hidden final row and horizontal insets', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({
        viewport: { width: 800, height: 600 },
      })
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        await readFile(
          new URL('../fixtures/site/sticky-pager.html', import.meta.url),
          'utf8',
        ),
      )
      for (const state of [
        {
          scroll: 96,
          overlap: 0,
          inset: 16,
          covered: ['div#row6'],
          cramped: false,
        },
        {
          scroll: 192,
          overlap: 0,
          inset: 16,
          covered: ['div#row8'],
          cramped: false,
        },
        {
          scroll: Infinity,
          overlap: 0,
          inset: 16,
          covered: [],
          cramped: false,
        },
        {
          scroll: Infinity,
          overlap: -64,
          inset: 16,
          covered: ['div#row9'],
          cramped: false,
        },
        {
          scroll: Infinity,
          overlap: -64,
          inset: 2,
          covered: ['div#row9'],
          cramped: true,
        },
      ]) {
        const metrics = await page.evaluate<{
          top: number
          max: number
        }>(`(() => {
          const scroller = document.getElementById('scroller');
          scroller.style.setProperty('--pager-overlap', '${String(state.overlap)}px');
          scroller.style.setProperty('--row-inset', '${String(state.inset)}px');
          scroller.scrollTop = ${Number.isFinite(state.scroll) ? String(state.scroll) : 'scroller.scrollHeight'};
          return { top: scroller.scrollTop, max: scroller.scrollHeight - scroller.clientHeight };
        })()`)
        const probe = await page.evaluate<ProbeResult>(
          `(${probeSource()})('main')`,
        )
        const snapshot = snapshotOf(probe.elements, {
          rootBackgrounds: probe.rootBackgrounds,
        })
        expect(
          textOcclusion(snapshot, ruleContext()).map(
            (finding) => finding.subject,
          ),
        ).toEqual(state.covered)
        const cramped = textCramped(snapshot, ruleContext())
        expect(cramped.length > 0).toBe(state.cramped)
        expect(
          cramped.some(
            (finding) =>
              finding.subject === 'div#row9' && finding.message.includes('2px'),
          ),
        ).toBe(state.cramped)
        expect(
          probe.elements.find((box) => box.selector === 'div#row6')?.occluder,
        ).toBe(
          state.scroll === 96
            ? probe.elements.find((box) => box.selector === 'div#pager')?.id
            : null,
        )
        expect(metrics.top).toBe(
          Number.isFinite(state.scroll) ? state.scroll : metrics.max,
        )
      }
    } finally {
      await browser.close()
    }
  })
})
