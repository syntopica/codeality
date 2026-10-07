import { describe, expect, it } from 'vitest'

import { isOnSite } from '@/sitemap/isOnSite.js'

const SITE = 'https://x.test'

describe('isOnSite', () => {
  it('accepts the same origin, or a path under a file: base', () => {
    expect(isOnSite('https://x.test/a.xml', SITE)).toBe(true)
    expect(isOnSite('file:///site/a.xml', 'file:///site')).toBe(true)
  })
  it('refuses another host, another scheme, a file outside the base and junk', () => {
    expect(isOnSite('http://169.254.169.254/x', SITE)).toBe(false)
    expect(isOnSite('file:///etc/passwd', SITE)).toBe(false)
    expect(isOnSite('file:///etc/passwd', 'file:///site')).toBe(false)
    expect(isOnSite('file:///site-other/a.xml', 'file:///site')).toBe(false)
    expect(isOnSite('not a url', SITE)).toBe(false)
  })
})
