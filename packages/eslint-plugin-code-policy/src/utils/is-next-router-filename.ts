import { pathBasename } from '@/utils/path-basename.js'

// An App Router special file, whose reserved exports (`metadata`, `GET`,
// `size`, `register`, ...) are framework contract rather than extra units.
// Matched on the whole name, so `homepage.tsx` or `reroute.ts` is an ordinary
// module. The list follows Next's file conventions, metadata image routes and
// the root `middleware`/`proxy`/`instrumentation` files included.
export function isNextRouterFilename(filename: string): boolean {
  return /^(?:page|layout|loading|error|global-error|not-found|global-not-found|forbidden|unauthorized|template|default|route|middleware|proxy|instrumentation|opengraph-image|twitter-image|icon|apple-icon)\.(?:tsx|jsx|js|ts)$/.test(
    pathBasename(filename),
  )
}
