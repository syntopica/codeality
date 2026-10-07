import type { RouteConfig } from '@/config/RouteConfig.js'
import type { Finding } from '@/model/Finding.js'
import { fingerprintFinding } from '@/model/fingerprintFinding.js'
import { routeTemplate } from '@/sitemap/routeTemplate.js'

/**
 * One warning per sitemap template no configured route renders: a gate that
 * lists the admin pages alone never sees the public grid that broke.
 */
export const uncoveredRouteFindings = (
  baseUrl: string,
  pages: string[],
  routes: RouteConfig[],
): Finding[] => {
  const covered = new Set(routes.map((route) => routeTemplate(route.path)))
  const groups = new Map<string, string[]>()
  for (const page of pages) {
    if (!page.startsWith(baseUrl)) continue
    const path = page.slice(baseUrl.length) || '/'
    const template = routeTemplate(path)
    if (!covered.has(template))
      groups.set(template, [...(groups.get(template) ?? []), path])
  }
  return [...groups].map(([template, paths]) => ({
    rule: 'route-uncovered',
    severity: 'warn',
    route: template,
    screens: [],
    message: `sitemap.xml lists ${String(paths.length)} page(s) under ${template} (${paths[0] ?? template}) and no configured route renders one; add one to routes`,
    subject: paths[0] ?? template,
    fingerprint: fingerprintFinding('route-uncovered', template, '*', template),
  }))
}
