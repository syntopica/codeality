import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { SITEMAP_TIMEOUT_MS } from '@/sitemap/SITEMAP_TIMEOUT_MS.js'

/** The document at `url`, or null when there is none to read: no sitemap is not an error. */
export const fetchSitemap = async (url: string): Promise<string | null> => {
  try {
    if (url.startsWith('file:'))
      return await readFile(fileURLToPath(url), 'utf8')
    const response = await fetch(url, {
      signal: AbortSignal.timeout(SITEMAP_TIMEOUT_MS),
    })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}
