import { readFile } from 'node:fs/promises'

import { checkInteractionShift } from '@/capture/checkInteractionShift.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('tab interaction finding retention', () => {
  it('retains an earlier growing-list finding when a later list disappears', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      page.setDefaultTimeout(250)
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        await readFile(
          new URL('../fixtures/site/shift-tabs.html', import.meta.url),
          'utf8',
        ),
      )
      await page.evaluate(`(() => {
        const main = document.querySelector('main')
        if (!main) throw new Error('Missing fixture main')
        main.insertAdjacentHTML('beforeend', '<div role="tablist" aria-label="Transient" onclick="this.remove()"><button role="tab" aria-selected="true">First</button><button role="tab" aria-selected="false">Second</button></div>')
      })()`)
      expect(await page.locator('[role="tablist"]').count()).toBe(2)
      const failures = await checkInteractionShift(page, 'main')
      expect(failures.map((failure) => failure.subject)).toEqual([
        'tab list "View"',
      ])
      expect(await page.locator('[aria-label="Transient"]').count()).toBe(0)
      expect(
        await page
          .locator('[aria-controls="review"]')
          .getAttribute('aria-selected'),
      ).toBe('true')
    } finally {
      await browser.close()
    }
  })
})
