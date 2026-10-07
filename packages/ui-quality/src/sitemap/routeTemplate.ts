/**
 * The group a page belongs to: its first path segment, with `/*` when it goes
 * deeper (`/artistas/alba` is `/artistas/*`), so one route covers every page
 * rendered by the same template.
 */
export const routeTemplate = (path: string): string => {
  const segments = path.split(/[?#]/)[0]?.split('/').filter(Boolean) ?? []
  const first = segments[0]
  if (first === undefined) return '/'
  return segments.length > 1 ? `/${first}/*` : `/${first}`
}
