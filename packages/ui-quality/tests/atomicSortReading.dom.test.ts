import { columnOrderOf } from '@/behaviour/columnOrderOf.js'
import { columnKeys } from '@/capture/columnKeys.js'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { expect, it } from 'vitest'
import { duplicateSortFixtureMarker } from './duplicateSortFixtureMarker.js'
import { setMarkerAttribute } from './setMarkerAttribute.js'
import { SORT_TYPE_ATTRIBUTE } from './SORT_TYPE_ATTRIBUTE.js'
import { SORT_VALUE_ATTRIBUTE } from './SORT_VALUE_ATTRIBUTE.js'

it('reads declared current counts atomically without changing unmarked currency', async () => {
  const browser = await chromium.launch({ headless: true, timeout: 15000 })
  try {
    const page = await browser.newPage()
    await page.route('**/*', async (route) => route.abort())
    await page.setContent(
      await readFile(
        new URL('./fixtures/current-years.html', import.meta.url),
        'utf8',
      ),
    )
    const fallback = '1 año 2026'
    const years = page.locator('#years')
    expect(await columnKeys(years, 0)).toEqual([1, 1, 2])
    await page.locator('#ties').click()
    expect(await columnKeys(years, 0)).toEqual([1, 1, 2])
    await page.locator('#sort').click()
    expect(await columnKeys(years, 0)).toEqual([2, 1, 1])
    await page.locator('#ties').click()
    expect(await columnKeys(years, 0)).toEqual([2, 1, 1])
    await page.locator('#wrong').click()
    expect(columnOrderOf(await columnKeys(years, 0))).toBe('none')
    expect(await columnKeys(page.locator('#currency'), 0)).toEqual([
      -2, 0, 1234.5,
    ])
    expect(await columnKeys(page.locator('#usd'), 0)).toEqual([1234.5])
    expect(await columnKeys(page.locator('#zero'), 0)).toEqual([0])
    for (const value of ['NaN', 'Infinity', '', '1e3']) {
      await setMarkerAttribute(page, SORT_VALUE_ATTRIBUTE, value)
      expect((await columnKeys(years, 0))[0]).toBe(fallback)
    }
    await setMarkerAttribute(page, SORT_VALUE_ATTRIBUTE, '1')
    await setMarkerAttribute(page, SORT_VALUE_ATTRIBUTE, null)
    expect((await columnKeys(years, 0))[0]).toBe(fallback)
    await setMarkerAttribute(page, SORT_VALUE_ATTRIBUTE, '1')
    await setMarkerAttribute(page, SORT_TYPE_ATTRIBUTE, 'text')
    expect((await columnKeys(years, 0))[0]).toBe(fallback)
    await setMarkerAttribute(page, SORT_TYPE_ATTRIBUTE, 'number')
    for (const size of ['width:0;height:10px', 'width:10px;height:0']) {
      await setMarkerAttribute(page, 'style', `display:inline-block;${size}`)
      expect((await columnKeys(years, 0))[0]).toBe(fallback)
    }
    await setMarkerAttribute(page, 'style', 'opacity:0')
    expect((await columnKeys(years, 0))[0]).toBe(fallback)
    await setMarkerAttribute(page, 'style', 'visibility:hidden')
    expect((await columnKeys(years, 0))[0]).toBe(2026)
    await setMarkerAttribute(page, 'style', null)
    await setMarkerAttribute(page, 'hidden', '')
    expect((await columnKeys(years, 0))[0]).toBe(2026)
    await setMarkerAttribute(page, 'hidden', null)
    await duplicateSortFixtureMarker(page)
    expect(typeof (await columnKeys(years, 0))[0]).toBe('string')
    await page.locator('#unmarked').click()
    expect(await columnKeys(years, 0)).toEqual([
      '1 año 2026',
      '2 años 2025 · 2023',
      '1 año 2024',
    ])
  } finally {
    await browser.close()
  }
}, 45000)
