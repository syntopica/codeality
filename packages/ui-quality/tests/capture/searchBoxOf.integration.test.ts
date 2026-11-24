import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

import { searchBoxOf } from '@/capture/searchBoxOf.js'

describe('searchBoxOf', () => {
  it('finds the table search after an editable option picker', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.setContent(`
        <main>
          <input type="search" role="combobox" aria-expanded="true"
            aria-controls="options" aria-autocomplete="list"
            aria-label="Find a date range" placeholder="Buscar…" />
          <div role="listbox" id="options" aria-label="Date ranges">
            <div role="option">Today</div>
          </div>
          <input type="search" aria-label="Search customers" />
          <table aria-label="Customers"></table>
        </main>
      `)
      const search = await searchBoxOf(page, 'main')
      expect(await search?.getAttribute('aria-label')).toBe('Search customers')
    } finally {
      await browser.close()
    }
  })
})
