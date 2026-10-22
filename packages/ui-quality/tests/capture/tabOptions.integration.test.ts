import { TAB_OPTIONS } from '@/capture/TAB_OPTIONS.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('tab option ownership', () => {
  it('keeps nested tabs out of the outer tab list options', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(`
        <main><div role="tablist" id="outer">
          <button role="tab">First</button><button role="tab">Second</button>
          <div role="tablist"><button role="tab">Nested first</button><button role="tab">Nested second</button></div>
        </div></main>
      `)
      expect(
        await page.locator('#outer').locator(TAB_OPTIONS).allInnerTexts(),
      ).toEqual(['First', 'Second'])
    } finally {
      await browser.close()
    }
  })
})
