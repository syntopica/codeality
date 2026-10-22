import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { touchTarget } from '@/rules/touchTarget.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { STICKY_MASK_STYLE } from './STICKY_MASK_STYLE.js'
import { stickyTouchSetup } from './stickyTouchSetup.js'

describe('independent header mask paint', () => {
  it('refuses supported WebKit mask-box coverage and retains the original row overlap', async () => {
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
      await page.evaluate(
        stickyTouchSetup({
          scroll: 48,
          style: STICKY_MASK_STYLE,
          covered: false,
          exposed: true,
        }),
      )
      const evidenceJson = await page.evaluate<string>(`JSON.stringify((()=>{
        const header = document.querySelector('thead')
        const row = document.querySelector('#row')
        const box = row.getBoundingClientRect()
        const cover = header.getBoundingClientRect()
        const style = getComputedStyle(header)
        const hit = document.elementFromPoint((Math.max(box.left,cover.left)+Math.min(box.right,cover.right))/2,(Math.max(box.top,cover.top)+Math.min(box.bottom,cover.bottom))/2)
        return {supported:CSS.supports('-webkit-mask-box-image-source','linear-gradient(black,transparent)'),source:style.getPropertyValue('-webkit-mask-box-image-source'),maskImage:style.maskImage,centerIsHeader:header.contains(hit)}
      })())`)
      expect(JSON.parse(evidenceJson) as unknown).toMatchObject({
        supported: true,
        maskImage: 'none',
        centerIsHeader: true,
      })
      expect(evidenceJson).toContain('linear-gradient')
      const probe = await page.evaluate<ProbeResult>(
        `(${probeSource()})('main')`,
      )
      const row = probe.elements.find((box) => box.selector === 'button#row')
      expect(Object.hasOwn(row ?? {}, 'tapOcclusion')).toBe(false)
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
      const overlappingSubjects = findings
        .filter(
          (finding) =>
            finding.rule === 'touch-target' &&
            finding.identity.startsWith('overlap'),
        )
        .map((finding) => finding.subject)
      expect(overlappingSubjects).toContain('button#row')
    } finally {
      await browser.close()
    }
  }, 45000)
})
