import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'

const PAGE = `<!doctype html><meta charset="utf-8" />
<header style="border-bottom:1px solid #d1d5db;height:64px;position:relative">
  <div id="parked" style="position:absolute;top:0;left:0;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">
    <input id="search" type="search" style="width:300px;height:40px;border:1px solid #d1d5db" aria-label="Search" />
  </div>
  <input id="shown" type="search" style="margin:12px;width:200px;height:40px;border:1px solid #d1d5db" aria-label="Find" />
</header>`

describe('probe pixel clip', () => {
  it('leaves out a field parked in a one-pixel clipped wrapper, keeping one on screen', async () => {
    const browser = await chromium.launch({ headless: true, timeout: 15000 })
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 600 },
      })
      await page.setContent(PAGE)
      const probe = await page.evaluate<ProbeResult>(
        `(${probeSource()})('header')`,
      )
      const selectors = probe.elements.map((box) => box.selector)
      expect(selectors).toContain('input#shown')
      expect(selectors).not.toContain('input#search')
    } finally {
      await browser.close()
    }
  }, 60_000)
})
