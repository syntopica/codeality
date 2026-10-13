import { pathBasename } from '@/utils/path-basename.js'

// A slice barrel: a file named exactly `index` with any JS/TS extension.
export function isIndexFilename(filename: string): boolean {
  return /^index\.[mc]?[jt]sx?$/.test(pathBasename(filename))
}
