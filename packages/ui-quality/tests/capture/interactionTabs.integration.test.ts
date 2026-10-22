import { readFile } from 'node:fs/promises'

import { checkInteractionShift } from '@/capture/checkInteractionShift.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

import { tabClickCountOf } from './tabClickCountOf.js'

describe('interaction shift for tabs', () => {
  it('reports a growing tab list and restores the initially selected second link', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        await readFile(
          new URL('../fixtures/site/shift-tabs.html', import.meta.url),
          'utf8',
        ),
      )
      const failures = await checkInteractionShift(page, 'main')
      expect(failures.map((failure) => failure.subject)).toEqual([
        'tab list "View"',
      ])
      expect(failures[0]?.rule).toBe('interaction-shift')
      expect(
        await page
          .locator('[aria-controls="review"]')
          .getAttribute('aria-selected'),
      ).toBe('true')
      expect(await page.locator('#review').isVisible()).toBe(true)
      expect(await page.locator('#read').isVisible()).toBe(false)
      expect(await tabClickCountOf(page)).toBe('3')
    } finally {
      await browser.close()
    }
  })

  it('accepts different panel heights inside the same painted card', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        await readFile(
          new URL('../fixtures/site/shift-tabs-clean.html', import.meta.url),
          'utf8',
        ),
      )
      const tall = await page.locator('.card').boundingBox()
      await page.locator('[aria-controls="read"]').click()
      const short = await page.locator('.card').boundingBox()
      expect((tall?.height ?? 0) - (short?.height ?? 0)).toBe(160)
      await page.locator('[aria-controls="review"]').click()
      expect(await checkInteractionShift(page, 'main')).toEqual([])
      expect(
        await page
          .locator('[aria-controls="review"]')
          .getAttribute('aria-selected'),
      ).toBe('true')
    } finally {
      await browser.close()
    }
  })

  it('shares the four-group budget with existing toggle groups', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      for (const count of [3, 4]) {
        await page.setContent(
          await readFile(
            new URL('../fixtures/site/shift-tabs.html', import.meta.url),
            'utf8',
          ),
        )
        await page.evaluate(`(() => {
          const main = document.querySelector('main')
          if (!main) throw new Error('Missing fixture main')
          main.insertAdjacentHTML('afterbegin', '<div role="group"><button aria-pressed="true">One</button><button aria-pressed="false">Two</button></div>'.repeat(${String(count)}))
        })()`)
        expect(await page.locator('[role="group"]').count()).toBe(count)
        const failures = await checkInteractionShift(page, 'main')
        expect(failures.map((failure) => failure.subject)).toEqual(
          count === 3 ? ['tab list "View"'] : [],
        )
        expect(await tabClickCountOf(page)).toBe(count === 3 ? '3' : null)
      }
    } finally {
      await browser.close()
    }
  })

  it('samples six options and restores an initially selected seventh tab', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        await readFile(
          new URL('../fixtures/site/shift-tabs-limit.html', import.meta.url),
          'utf8',
        ),
      )
      expect(await checkInteractionShift(page, 'main')).toEqual([])
      expect(await tabClickCountOf(page)).toBe('7')
      expect(await page.locator('[aria-selected="true"]').innerText()).toBe(
        'Option 7',
      )
      expect(
        await page.locator('[role="tabpanel"]:visible').getAttribute('id'),
      ).toBe('panel-option7')
    } finally {
      await browser.close()
    }
  })

  it('leaves lists with no unique selected tab untouched', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      for (const selected of ['false', 'true']) {
        await page.setContent(
          await readFile(
            new URL('../fixtures/site/shift-tabs.html', import.meta.url),
            'utf8',
          ),
        )
        await page.evaluate(`(() => {
          const list = document.querySelector('[role="tablist"]')
          if (!list) throw new Error('Missing fixture tab list')
          for (const tab of list.querySelectorAll('[role="tab"]'))
            tab.setAttribute('aria-selected', ${JSON.stringify(selected)})
        })()`)
        expect(await page.locator('[aria-selected="true"]').count()).toBe(
          selected === 'true' ? 2 : 0,
        )
        expect(await checkInteractionShift(page, 'main')).toEqual([])
        expect(await tabClickCountOf(page)).toBeNull()
        expect(await page.locator('[aria-selected="true"]').count()).toBe(
          selected === 'true' ? 2 : 0,
        )
        expect(await page.locator('#review').isVisible()).toBe(true)
      }
    } finally {
      await browser.close()
    }
  })
})
