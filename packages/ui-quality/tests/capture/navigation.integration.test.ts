import { gotoSettled } from '@/capture/gotoSettled.js'
import { login } from '@/capture/login.js'
import { openRoute } from '@/capture/openRoute.js'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('navigation with an unfinished image', () => {
  const routePattern = 'http://fixture.test/**'
  const gateUrl = 'http://fixture.test/gate'
  afterEach(() => vi.unstubAllEnvs())

  it.each(['route', 'login'] as const)(
    'finishes the %s flow while the image request remains open',
    async (flow) => {
      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(1_000)
        let pendingImage = false
        await page.route(routePattern, async (route) => {
          const path = new URL(route.request().url()).pathname
          if (path === '/unfinished.png') {
            pendingImage = true
            return
          }
          await route.fulfill({
            contentType: 'text/html',
            body:
              path === '/login'
                ? '<form action="/dashboard"><input name="user"><input name="password" type="password"><button>Log in</button></form>'
                : '<h1>Ready</h1><img src="/unfinished.png">',
          })
        })
        if (flow === 'route') {
          await gotoSettled(page, 'http://fixture.test/dashboard')
        } else {
          vi.stubEnv('UIQ_HANG_USER', 'reader@example.com')
          vi.stubEnv('UIQ_HANG_PASSWORD', 'synthetic-fixture')
          await login(page, 'http://fixture.test', {
            loginPath: '/login',
            usernameEnv: 'UIQ_HANG_USER',
            passwordEnv: 'UIQ_HANG_PASSWORD',
            usernameSelector: '[name=user]',
            passwordSelector: '[name=password]',
            submitSelector: 'button',
            storageState: null,
          })
        }
        expect(pendingImage).toBe(true)
        expect(new URL(page.url()).pathname).toBe('/dashboard')
        expect(await page.locator('h1').innerText()).toBe('Ready')
        expect(await page.evaluate<string>('document.readyState')).toBe(
          'interactive',
        )
      } finally {
        await browser.close()
      }
    },
    40_000,
  )
  it('does not return a gate document while its client auth redirect is pending', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      let redirected = false
      await page.route(routePattern, async (route) => {
        if (new URL(route.request().url()).pathname === '/login') {
          redirected = true
          return
        }
        await route.fulfill({
          contentType: 'text/html',
          body: '<h1>Gate</h1><script>addEventListener("load", () => location.replace("/login"))</script>',
        })
      })
      await expect(gotoSettled(page, gateUrl)).rejects.toThrow()
      expect(redirected).toBe(true)
    } finally {
      await browser.close()
    }
  }, 40_000)
  it('signs in after a client-side authentication redirect', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-navigation-'))
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      vi.stubEnv('UIQ_HANG_USER', 'reader@example.com')
      vi.stubEnv('UIQ_HANG_PASSWORD', 'synthetic-fixture')
      await page.route(routePattern, async (route) => {
        await route.fulfill({
          contentType: 'text/html',
          body:
            new URL(route.request().url()).pathname === '/login'
              ? `<form onsubmit="localStorage.setItem('session','yes');location.replace('/gate');return false"><input name="user"><input name="password" type="password"><button>Log in</button></form>`
              : '<h1>Account</h1><script>if(localStorage.getItem("session")!=="yes")addEventListener("load",()=>location.replace("/login"))</script>',
        })
      })
      await openRoute(page, '/gate', {
        baseUrl: 'http://fixture.test',
        auth: {
          loginPath: '/login',
          usernameEnv: 'UIQ_HANG_USER',
          passwordEnv: 'UIQ_HANG_PASSWORD',
          usernameSelector: '[name=user]',
          passwordSelector: '[name=password]',
          submitSelector: 'button',
          storageState: null,
        },
        statePath: join(root, 'state.json'),
      })
      expect(new URL(page.url()).pathname).toBe('/gate')
      expect(await page.locator('h1').innerText()).toBe('Account')
      expect(
        await page.evaluate<string>('localStorage.getItem("session")'),
      ).toBe('yes')
    } finally {
      await browser.close()
      rmSync(root, { recursive: true, force: true })
    }
  }, 40_000)
  it('rejects a failed client-side authentication redirect', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route(routePattern, async (route) => {
        if (new URL(route.request().url()).pathname === '/login') {
          await route.abort('failed')
          return
        }
        await route.fulfill({
          contentType: 'text/html',
          body: '<h1>Gate</h1><script>addEventListener("load", () => location.replace("/login"))</script>',
        })
      })
      await expect(gotoSettled(page, gateUrl)).rejects.toThrow()
    } finally {
      await browser.close()
    }
  }, 40_000)
  it('accepts a newer successful redirect after an earlier navigation is canceled', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route(routePattern, async (route) => {
        const path = new URL(route.request().url()).pathname
        if (path === '/cancelled') {
          await route.abort('aborted')
          return
        }
        await route.fulfill({
          contentType: 'text/html',
          body:
            path === '/final'
              ? '<h1>Ready</h1>'
              : '<h1>Gate</h1><script>addEventListener("load", () => { location.replace("/cancelled"); setTimeout(() => location.replace("/final"), 100) })</script>',
        })
      })
      await gotoSettled(page, gateUrl)
      expect(new URL(page.url()).pathname).toBe('/final')
      expect(await page.locator('h1').innerText()).toBe('Ready')
    } finally {
      await browser.close()
    }
  }, 40_000)
  it('accepts a same-document history redirect', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route(routePattern, async (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<h1>Ready</h1><script>history.replaceState(null,"","/dashboard")</script>',
        }),
      )
      await gotoSettled(page, gateUrl)
      expect(new URL(page.url()).pathname).toBe('/dashboard')
    } finally {
      await browser.close()
    }
  })
  it('still rejects a failed document navigation', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route(routePattern, async (route) => route.abort('failed'))
      await expect(
        gotoSettled(page, 'http://fixture.test/dashboard'),
      ).rejects.toThrow()
    } finally {
      await browser.close()
    }
  })
})
