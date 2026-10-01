import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { isDisabled } from '@/config/isDisabled.js'
import { readConfig } from '@/config/readConfig.js'
import type { Finding } from '@/model/Finding.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

describe('configuration', () => {
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
      routes: [{ path: '/admin', main: 'main.admin', waitFor: 'ul' }],
      viewports: [{ width: 800, height: 600 }],
      colorSchemes: ['dark'],
      palette: { variablePrefixes: ['--brand-'], colors: ['#fff'] },
      rules: {
        'content-width': { minRatio: 0.9 },
        'control-inset': { minInset: 8 },
      },
      disable: [
        { rule: 'palette', selector: '.vendor', reason: 'third party' },
      ],
    })
    expect(config.auth?.usernameEnv).toBe('UI_QUALITY_USER')
    expect(config.routes[0]).toEqual({
      path: '/admin',
      main: 'main.admin',
      waitFor: 'ul',
    })
    expect(config.rules.controlInset.minInset).toBe(8)
    expect(config.disable[0]?.route).toBeNull()
  })
  it.each([
    [[], 'JSON object'],
    [{ baseUrl: 'x', routes: [] }, 'at least one route'],
    [{ baseUrl: 'x', routes: ['admin'] }, 'start with "/"'],
    [{ baseUrl: 'x', routes: [3] }, 'a path or an object'],
    [{ baseUrl: 'x', routes: '/' }, 'must be a list'],
    [{ baseUrl: 'x', routes: ['/'], colorSchemes: ['sepia'] }, 'colorSchemes'],
    [
      { baseUrl: 'x', routes: ['/'], viewports: [{ width: -1, height: 1 }] },
      'positive number',
    ],
    [{ baseUrl: 'x', routes: ['/'], viewports: [1] }, 'must be an object'],
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
  it('matches disable entries by rule, route and selector', () => {
    const finding = {
      rule: 'palette',
      route: '/a',
      subject: 'div.vendor > span',
    } as Finding
    const entry = {
      rule: 'palette',
      route: null,
      selector: '.vendor',
      reason: 'r',
    }
    expect(isDisabled(finding, [entry])).toBe(true)
    expect(isDisabled(finding, [{ ...entry, route: '/b' }])).toBe(false)
    expect(isDisabled(finding, [{ ...entry, rule: '*', selector: null }])).toBe(
      true,
    )
    expect(isDisabled(finding, [{ ...entry, selector: '.mine' }])).toBe(false)
  })
})
