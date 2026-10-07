import { fetchSitemap } from '@/sitemap/fetchSitemap.js'
import { isOnSite } from '@/sitemap/isOnSite.js'
import { MAX_CHILD_SITEMAPS } from '@/sitemap/MAX_CHILD_SITEMAPS.js'
import { sitemapLocations } from '@/sitemap/sitemapLocations.js'

/**
 * The page addresses `baseUrl/sitemap.xml` lists, following one level of a
 * sitemap index; empty when the site publishes none. The index is remote
 * content, so only the children it names on the site itself are fetched.
 */
export const sitemapPages = async (baseUrl: string): Promise<string[]> => {
  const root = await fetchSitemap(`${baseUrl}/sitemap.xml`)
  if (root === null) return []
  if (!root.includes('<sitemapindex')) return sitemapLocations(root)
  const children = await Promise.all(
    sitemapLocations(root)
      .filter((child) => isOnSite(child, baseUrl))
      .slice(0, MAX_CHILD_SITEMAPS)
      .map(async (child) => await fetchSitemap(child, 'manual')),
  )
  return children.flatMap((xml) => (xml === null ? [] : sitemapLocations(xml)))
}
