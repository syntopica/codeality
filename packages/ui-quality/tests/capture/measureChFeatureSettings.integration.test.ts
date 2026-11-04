import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('paragraph measure', () => {
  it.each(['normal', "'onum' on", "'ss01' on"])(
    'reads the same measure in ch with font-feature-settings %s',
    async (features) => {
      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage()
        const words =
          'A paragraph long enough to wrap onto several lines. '.repeat(8)
        await page.setContent(
          `<main><p id="measured" style="width:480px;font:20px/1.5 Arial,sans-serif;font-feature-settings:${features}">${words}</p></main>`,
        )
        const probe = await page.evaluate<ProbeResult>(
          `(${probeSource()})('main')`,
        )
        const paragraph = probe.elements.find((box) =>
          box.selector.includes('measured'),
        )
        const zero = await page.evaluate<number>(
          `(() => { const context = document.createElement('canvas').getContext('2d'); context.font = '20px Arial, sans-serif'; return context.measureText('0').width })()`,
        )
        expect(paragraph?.measureCh).toBeCloseTo(480 / zero, 0)
      } finally {
        await browser.close()
      }
    },
  )
})
