import { pathBasename } from '@/utils/path-basename.js'

// An App Router special file, whose reserved exports (`metadata`, `GET`, ...)
// are framework contract rather than extra units. Matched on the whole name,
// so `homepage.tsx` or `reroute.ts` is an ordinary module.
export function isNextRouterFilename(filename: string): boolean {
  return /^(?:(?:page|layout|loading|error|not-found)\.(?:tsx|jsx|js|ts)|route\.(?:ts|js)|middleware\.(?:ts|js))$/.test(
    pathBasename(filename),
  )
}
