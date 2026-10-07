import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// The package's own node_modules is linked in, so `kysely` resolves from the
// temporary project the way it would from a consumer's.
export const kyselyTempProject = (
  files: Record<string, string>,
  linkModules = true,
): string => {
  const root = mkdtempSync(join(tmpdir(), 'dbq-kysely-'))
  if (linkModules)
    symlinkSync(
      new URL('../../../node_modules', import.meta.url).pathname,
      join(root, 'node_modules'),
    )
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
