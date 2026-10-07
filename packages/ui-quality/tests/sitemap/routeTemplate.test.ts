import { describe, expect, it } from 'vitest'

import { routeTemplate } from '@/sitemap/routeTemplate.js'
import { sitemapLocations } from '@/sitemap/sitemapLocations.js'

describe('routeTemplate', () => {
  it('groups pages by their first segment', () => {
    expect(routeTemplate('/')).toBe('/')
    expect(routeTemplate('/legal?lang=es')).toBe('/legal')
    expect(routeTemplate('/artistas/alba')).toBe('/artistas/*')
    expect(routeTemplate('/artistas/alba/fotos#top')).toBe('/artistas/*')
  })
})

describe('sitemapLocations', () => {
  it('reads every loc, trimmed and decoded', () => {
    expect(
      sitemapLocations(
        '<urlset><url><loc> https://x.test/a?b=1&amp;c=2 </loc></url><url><loc>https://x.test/</loc></url></urlset>',
      ),
    ).toEqual(['https://x.test/a?b=1&c=2', 'https://x.test/'])
  })
})
