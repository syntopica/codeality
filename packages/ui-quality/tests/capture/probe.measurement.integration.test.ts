import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { undersizedText } from '@/rules/undersizedText.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('Recharts measurement probe', () => {
  it.each([
    [-20_000, false],
    [0, true],
  ] as const)(
    'keeps visible-text checks accurate with the measurement span at y=%s',
    async (top, painted) => {
      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage()
        await page.setContent(
          `<main><span id="recharts_measurement_span" aria-hidden="true" style="position:absolute;top:${String(top)}px;left:0;padding:0;margin:0;border:none;white-space:pre;font-size:9px">Measure text</span></main>`,
        )
        const probe = await page.evaluate<ProbeResult>(
          `(${probeSource()})('main')`,
        )
        const element = probe.elements.find((box) =>
          box.selector.includes('recharts_measurement_span'),
        )
        expect(element !== undefined).toBe(painted)
        const findings = undersizedText(
          snapshotOf(probe.elements),
          ruleContext(),
        )
        expect(
          findings.some((finding) =>
            finding.subject.includes('recharts_measurement_span'),
          ),
        ).toBe(painted)
      } finally {
        await browser.close()
      }
    },
  )
})
