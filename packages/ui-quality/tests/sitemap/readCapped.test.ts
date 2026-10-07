import { describe, expect, it } from 'vitest'

import { MAX_SITEMAP_BYTES } from '@/sitemap/MAX_SITEMAP_BYTES.js'
import { readCapped } from '@/sitemap/readCapped.js'

const MEGABYTE = 1024 * 1024

describe('readCapped', () => {
  it('reads a body under the cap', async () => {
    expect(await readCapped(new Response('<urlset/>'))).toBe('<urlset/>')
  })
  it('stops reading a body past the cap', async () => {
    let sent = 0
    const endless = new ReadableStream<Uint8Array>({
      pull: (controller) => {
        sent += MEGABYTE
        controller.enqueue(new Uint8Array(MEGABYTE))
      },
    })
    expect(await readCapped(new Response(endless))).toBeNull()
    expect(sent).toBeLessThanOrEqual(MAX_SITEMAP_BYTES + 2 * MEGABYTE)
  })
})
