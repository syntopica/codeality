import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { tsconfigFileNames } from '@/eslint/kysely/tsconfigFileNames.js'
import { loadTypeScript } from '@/postgrest/loadTypeScript.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

/** The files the project's tsconfig.json includes, which can be linted with types; empty without one or without typescript. */
export const typedLintFiles = (root: string, tsconfig: string): Set<string> => {
  if (!existsSync(tsconfig)) return new Set()
  try {
    const compiler = loadTypeScript([
      join(root, 'package.json'),
      import.meta.url,
    ])
    return new Set(
      tsconfigFileNames(compiler, tsconfig, root).map((path) => resolve(path)),
    )
  } catch (error) {
    if (error instanceof ToolMissingError) return new Set()
    throw error
  }
}
