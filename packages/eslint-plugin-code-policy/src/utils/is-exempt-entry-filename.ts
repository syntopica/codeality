// Filenames that legitimately hold multiple top-level declarations: tool
// config entrypoints, ambient declaration files, and slice index barrels.
// Shared by atomic-file and one-primary-unit so the exemption list cannot
// drift between the two rules again.
export function isExemptEntryFilename(filename: string): boolean {
  return (
    filename.endsWith('.config.ts') ||
    filename.endsWith('.config.js') ||
    filename.endsWith('.config.mjs') ||
    filename.endsWith('.config.cjs') ||
    filename.endsWith('.d.ts') ||
    filename.endsWith('index.ts') ||
    filename.endsWith('index.tsx') ||
    filename.endsWith('index.js')
  )
}
