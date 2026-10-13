import { isIndexFilename } from '@/utils/is-index-filename.js'

// Filenames that legitimately hold multiple top-level declarations: tool
// config entrypoints, ambient declaration files, and slice index barrels.
// Shared by atomic-file and one-primary-unit so the exemption list cannot
// drift between the two rules again.
export function isExemptEntryFilename(filename: string): boolean {
  return (
    /\.config\.[mc]?[jt]s$/.test(filename) ||
    /\.d\.[mc]?ts$/.test(filename) ||
    isIndexFilename(filename)
  )
}
