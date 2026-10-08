import { writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'

// Writes the probe module that re-exports the live (kysely-codegen) and
// declared (hand-written) database types under fixed names, so the compiler
// API can find them without caring where the project keeps its own type.
export const writeDriftProbe = (
  root: string,
  scratch: string,
  ref: DatabaseTypeRef,
): string => {
  const probe = join(scratch, 'probe.ts')
  const modulePath = join(root, ref.path)
  const relativePath = relative(scratch, modulePath)
    .split('\\')
    .join('/')
    .replace(/\.ts$/, '.js')
  const importPath = relativePath.startsWith('.')
    ? relativePath
    : `./${relativePath}`
  const contents = [
    `import type { DB } from './db.js'`,
    `import type { ${ref.exportName} as Hand } from '${importPath}'`,
    `export type Live = DB`,
    `export type Declared = Hand`,
    '',
  ].join('\n')

  writeFileSync(probe, contents)
  return probe
}
