import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { readConfig } from '@/config/readConfig.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

describe('configuration', () => {
  const AXE_BASE = 'https://axe.test'
  it('reads axe options and init scripts, with defaults', () => {
    const plain = configFromDocument({
      baseUrl: AXE_BASE,
      routes: ['/'],
    })
    expect(plain.axe).toEqual({ exclude: [], timeoutMs: 60_000 })
    expect(plain.initScripts).toEqual([])
    const set = configFromDocument({
      baseUrl: AXE_BASE,
      routes: ['/'],
      axe: { exclude: ['#ads'], timeoutMs: 5000 },
      initScripts: ['e2e/stub.js'],
    })
    expect(set.axe).toEqual({ exclude: ['#ads'], timeoutMs: 5000 })
    expect(set.initScripts).toEqual(['e2e/stub.js'])
    expect(() =>
      configFromDocument({ baseUrl: AXE_BASE, routes: ['/'], axe: 'all' }),
    ).toThrow(ConfigError)
    expect(() =>
      configFromDocument({
        baseUrl: AXE_BASE,
        routes: ['/'],
        axe: { timeoutMs: 0 },
      }),
    ).toThrow(ConfigError)
  })
  it('applies the defaults to a minimal document', () => {
    const config = configFromDocument({
      baseUrl: 'http://localhost:3000/',
      routes: ['/'],
    })
    expect(config.baseUrl).toBe('http://localhost:3000')
    expect(config.viewports).toHaveLength(3)
    expect(config.colorSchemes).toEqual(['light', 'dark'])
    expect(config.auth).toBeNull()
    expect(config.palette).toBeNull()
    expect(config.rules.contentWidth.minRatio).toBe(0.8)
  })
  it('reads every section', () => {
    const config = configFromDocument({
      baseUrl: 'https://x.test',
      auth: { loginPath: '/auth/login' },
      routes: [
        {
          path: '/admin',
          main: 'main.admin',
          waitFor: 'ul',
          localStorage: { view: 'sales' },
          click: ['role=tab[name="Clientes"]'],
        },
      ],
      viewports: [{ width: 800, height: 600 }],
      colorSchemes: ['dark'],
      palette: { variablePrefixes: ['--brand-'], colors: ['#fff'] },
      rules: {
        'content-width': { minRatio: 0.9 },
        'control-inset': { minInset: 8 },
      },
      disable: [
        { rule: 'palette', selector: '.vendor', reason: 'third party' },
        {
          rule: 'console-error',
          message: 'picture-in-picture',
          reason: 'Turnstile iframe',
        },
      ],
    })
    expect(config.auth?.usernameEnv).toBe('UI_QUALITY_USER')
    expect(config.auth?.storageState).toBeNull()
    expect(config.routes[0]).toEqual({
      path: '/admin',
      main: 'main.admin',
      waitFor: 'ul',
      localStorage: { view: 'sales' },
      click: ['role=tab[name="Clientes"]'],
    })
    expect(config.rules.controlInset.minInset).toBe(8)
    expect(config.disable[0]?.route).toBeNull()
    expect(config.disable[0]?.message).toBeNull()
    expect(config.disable[1]?.message).toBe('picture-in-picture')
  })
  it('marks a phone viewport and leaves desktop ones plain', () => {
    const config = configFromDocument({
      baseUrl: 'https://x.test',
      routes: ['/'],
      viewports: [
        { width: 1440, height: 900, mobile: false },
        { width: 390, height: 844, mobile: true },
      ],
    })
    expect(config.viewports).toEqual([
      { width: 1440, height: 900 },
      { width: 390, height: 844, mobile: true },
    ])
  })
  it('reads a session file the project mints itself', () => {
    const config = configFromDocument({
      baseUrl: 'https://x.test',
      auth: { storageState: 'e2e/.auth/state.json' },
      routes: ['/'],
    })
    expect(config.auth?.storageState).toBe('e2e/.auth/state.json')
  })
  it.each([
    [[], 'JSON object'],
    [{ baseUrl: 'x', routes: [] }, 'at least one route'],
    [{ baseUrl: 'x', routes: ['admin'] }, 'start with "/"'],
    [{ baseUrl: 'x', routes: [3] }, 'a path or an object'],
    [
      { baseUrl: 'x', routes: [{ path: '/', localStorage: { view: 1 } }] },
      'localStorage must be an object of strings',
    ],
    [{ baseUrl: 'x', routes: '/' }, 'must be a list'],
    [{ baseUrl: 'x', routes: ['/'], colorSchemes: ['sepia'] }, 'colorSchemes'],
    [
      { baseUrl: 'x', routes: ['/'], viewports: [{ width: -1, height: 1 }] },
      'positive number',
    ],
    [{ baseUrl: 'x', routes: ['/'], viewports: [1] }, 'must be an object'],
    [
      {
        baseUrl: 'x',
        routes: ['/'],
        viewports: [{ width: 390, height: 844, mobile: 'yes' }],
      },
      'mobile must be a boolean',
    ],
    [{ baseUrl: 'x', routes: ['/'], palette: { colors: ['pink'] } }, '#rgb'],
    [
      { baseUrl: 'x', routes: ['/'], palette: 'pink' },
      'palette must be an object',
    ],
    [
      { baseUrl: 'x', routes: ['/'], palette: { colors: [1] } },
      'list of strings',
    ],
    [{ baseUrl: 'x', routes: ['/'], auth: 'yes' }, 'auth must be an object'],
    [
      { baseUrl: 'x', routes: ['/'], auth: { storageState: '' } },
      'auth.storageState must be a non-empty string',
    ],
    [{ baseUrl: 'x', routes: ['/'], rules: [] }, 'rules must be an object'],
    [
      { baseUrl: 'x', routes: ['/'], rules: { palette: 1 } },
      'rules.palette must be an object',
    ],
    [
      { baseUrl: 'x', routes: ['/'], disable: [1] },
      'disable[0] must be an object',
    ],
    [{ routes: ['/'] }, 'baseUrl must be a non-empty string'],
  ])('rejects %j', (document, message) => {
    expect(() => configFromDocument(document)).toThrow(ConfigError)
    expect(() => configFromDocument(document)).toThrow(message)
  })
  it('reads the file and explains a missing or broken one', () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    expect(() => readConfig(root)).toThrow('codeality-ui.json not found')
    writeFileSync(join(root, 'codeality-ui.json'), '{')
    expect(() => readConfig(root)).toThrow('not valid JSON')
    writeFileSync(
      join(root, 'codeality-ui.json'),
      '{"baseUrl":"http://x","routes":["/"]}',
    )
    expect(readConfig(root).routes).toHaveLength(1)
  })
})
