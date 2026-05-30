import { describe, expect, it, vi } from 'vitest'

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')

describe('siteMetadata', () => {
  it('sets metadataBase to NEXT_PUBLIC_SITE_URL', async () => {
    const { siteMetadata } = await import('./siteMetadata')
    const base = siteMetadata.metadataBase
    const href = base instanceof URL ? base.href : base
    expect(href).toBe('https://example.com/')
  })

  it('includes title and description', async () => {
    const { siteMetadata } = await import('./siteMetadata')
    expect(typeof siteMetadata.title).toBe('object')
    expect(siteMetadata.description).toContain('baseline')
  })

  it('includes openGraph url', async () => {
    const { siteMetadata } = await import('./siteMetadata')
    expect(siteMetadata.openGraph?.url).toBe('https://example.com')
  })
})
