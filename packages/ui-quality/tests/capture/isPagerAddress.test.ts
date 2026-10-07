import { describe, expect, it } from 'vitest'

import { isPagerAddress } from '@/capture/isPagerAddress.js'

describe('isPagerAddress', () => {
  it('accepts another query or a path below the route', () => {
    expect(isPagerAddress('https://x.test/artists', '?page=2')).toBe(true)
    expect(isPagerAddress('https://x.test/artists', '/artists/page/2')).toBe(
      true,
    )
    expect(isPagerAddress('https://x.test/artists/', '/artists?page=2')).toBe(
      true,
    )
    expect(isPagerAddress('https://x.test/', '/page/2')).toBe(true)
  })
  it('rejects a sibling article, another route and another origin', () => {
    expect(isPagerAddress('https://x.test/blog/a', '/blog/b')).toBe(false)
    expect(isPagerAddress('https://x.test/artists', '/artistsx')).toBe(false)
    expect(isPagerAddress('https://x.test/a', 'https://y.test/a?page=2')).toBe(
      false,
    )
  })
})
