import { pathBasename } from '@/utils/path-basename.js'

// Next.js 16 renamed `middleware` to `proxy`: the file exports the handler and
// its `config` side by side by framework contract.
export function isNextProxyFilename(filename: string): boolean {
  return /^proxy\.[jt]s$/.test(pathBasename(filename))
}
