/** Every `<loc>` of a sitemap or sitemap index, entities decoded. */
export const sitemapLocations = (xml: string): string[] =>
  [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) =>
    (match[1] ?? '')
      .trim()
      .replaceAll('&amp;', '&')
      .replaceAll('&apos;', "'")
      .replaceAll('&quot;', '"')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>'),
  )
