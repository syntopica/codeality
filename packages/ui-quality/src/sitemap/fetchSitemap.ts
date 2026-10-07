import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { MAX_SITEMAP_BYTES } from '@/sitemap/MAX_SITEMAP_BYTES.js'
import { readCapped } from '@/sitemap/readCapped.js'
import { SITEMAP_TIMEOUT_MS } from '@/sitemap/SITEMAP_TIMEOUT_MS.js'

/**
 * The document at `url`, or null when there is none to read: no sitemap is
 * not an error, and neither is one over `MAX_SITEMAP_BYTES`. A child of a
 * sitemap index is fetched with `redirect: 'manual'`, so an address on the
 * site cannot bounce the request somewhere else.
 */
export const fetchSitemap = async (
  url: string,
  redirect: 'follow' | 'manual' = 'follow',
): Promise<string | null> => {
  try {
    if (url.startsWith('file:')) {
      const file = fileURLToPath(url)
      return (await stat(file)).size > MAX_SITEMAP_BYTES
        ? null
        : await readFile(file, 'utf8')
    }
    const response = await fetch(url, {
      redirect,
      signal: AbortSignal.timeout(SITEMAP_TIMEOUT_MS),
    })
    return response.ok ? await readCapped(response) : null
  } catch {
    return null
  }
}
