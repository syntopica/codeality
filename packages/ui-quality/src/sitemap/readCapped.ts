import type { ReadableStream } from 'node:stream/web'

import { MAX_SITEMAP_BYTES } from '@/sitemap/MAX_SITEMAP_BYTES.js'

/** A response body as text, or null once it passes `MAX_SITEMAP_BYTES`. */
export const readCapped = async (
  response: Response,
): Promise<string | null> => {
  if (!response.body) return ''
  // Typed through node:stream/web: the package compiles without the DOM library.
  const reader = (response.body as ReadableStream<Uint8Array>).getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return Buffer.concat(chunks).toString('utf8')
    size += value.byteLength
    if (size > MAX_SITEMAP_BYTES) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }
}
