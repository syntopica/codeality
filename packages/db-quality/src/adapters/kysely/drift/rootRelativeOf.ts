import { relative } from 'node:path'

import type { RootRelative } from '@/adapters/kysely/drift/RootRelative.js'

// Builds a `RootRelative` for a given project root, so declared locations in
// findings are root-relative and POSIX, like the rest of this tool.
export const rootRelativeOf =
  (root: string): RootRelative =>
  (path) =>
    relative(root, path).split('\\').join('/')
