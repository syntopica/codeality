import type { ColumnOrder } from '@/behaviour/ColumnOrder.js'
import { orderAfterClick } from '@/capture/orderAfterClick.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

// A server-sorted board: a click dims the rows into placeholders at once and
// asks the server for the order, which answers after `DELAY_MS`: longer than
// the page is given to settle, so only the open request says it is not done.
const DELAY_MS = 6_000
const NAMES = ['Mieres', 'Avilés', 'Zamora', 'Burgos']
const PAGE = `<table><thead><tr><th><button>Name</button></th></tr></thead>
<tbody>${NAMES.map((name) => `<tr><td>${name}</td></tr>`).join('')}</tbody></table>
<script>
  let direction = 'desc'
  document.querySelector('button').addEventListener('click', async () => {
    direction = direction === 'asc' ? 'desc' : 'asc'
    const cells = [...document.querySelectorAll('td')]
    cells.forEach((cell, index) => (cell.textContent = ['Zzz', 'Aaa', 'Mmm', 'Bbb'][index]))
    const names = await (await fetch('/rows?direction=' + direction)).json()
    cells.forEach((cell, index) => (cell.textContent = names[index]))
  })
</script>`

const ordersAfterTwoClicks = async (
  answers: boolean,
): Promise<(ColumnOrder | null)[]> => {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.route('http://fixture.test/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname !== '/rows') {
        await route.fulfill({ contentType: 'text/html', body: PAGE })
        return
      }
      if (!answers) return
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
      const sorted = NAMES.toSorted((a, b) => a.localeCompare(b, 'es'))
      await route.fulfill({
        json:
          url.searchParams.get('direction') === 'asc'
            ? sorted
            : sorted.toReversed(),
      })
    })
    await page.goto('http://fixture.test/board')
    const table = page.locator('table')
    const button = page.locator('button')
    const first = await orderAfterClick(page, table, button, 0)
    return [first, await orderAfterClick(page, table, button, 0)]
  } finally {
    await browser.close()
  }
}

describe('sorting a board the server sorts', () => {
  it('reads the order once the answer lands, not the placeholders shown meanwhile', async () => {
    expect(await ordersAfterTwoClicks(true)).toEqual(['asc', 'desc'])
  }, 60_000)
  it('does not read an order from a sort whose answer never arrives', async () => {
    expect(await ordersAfterTwoClicks(false)).toEqual([null, null])
  }, 60_000)
})
