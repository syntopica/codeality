import { devices } from 'playwright'
import { describe, expect, it } from 'vitest'

import { screenContextOptions } from '@/capture/screenContextOptions.js'
import { screenshotName } from '@/capture/screenshotName.js'
import { screenLabel } from '@/model/screenLabel.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

describe('screen context options', () => {
  it('keeps a desktop viewport a plain window', () => {
    const options = screenContextOptions(
      { width: 1440, height: 900 },
      'dark',
      null,
      devices,
    )
    expect(options).toEqual({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    })
  })
  it('gives a mobile viewport the traits of an iPhone at its own size', () => {
    const options = screenContextOptions(
      { width: 390, height: 844, mobile: true },
      'light',
      undefined,
      devices,
    )
    expect(options).toMatchObject({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
      userAgent: devices['iPhone 15'].userAgent,
    })
    expect(options.userAgent).toContain('iPhone')
  })
  it('fails as configuration when Playwright lacks the phone device', () => {
    expect(() =>
      screenContextOptions(
        { width: 390, height: 844, mobile: true },
        'light',
        null,
        {} as typeof devices,
      ),
    ).toThrow(ConfigError)
  })
  it('labels a phone screen apart from a desktop one of the same size', () => {
    const phone = {
      route: '/inbox',
      viewport: { width: 390, height: 844, mobile: true as const },
      colorScheme: 'light' as const,
    }
    const narrow = { ...phone, viewport: { width: 390, height: 844 } }
    expect(screenLabel(phone)).toBe('390x844 phone light')
    expect(screenLabel(narrow)).toBe('390x844 light')
    expect(screenshotName(phone)).toBe('inbox.390x844-phone.light.png')
    expect(screenshotName(narrow)).toBe('inbox.390x844.light.png')
  })
})
