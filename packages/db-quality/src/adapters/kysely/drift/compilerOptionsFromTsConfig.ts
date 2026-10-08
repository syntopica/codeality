import { dirname } from 'node:path'

import type { DriftTypeScript } from '@/adapters/kysely/drift/DriftTypeScript.js'
import type { TsConfigCompilerOptions } from '@/adapters/kysely/drift/TsConfigCompilerOptions.js'

// Finds and parses the project's tsconfig.json, if any, and strips the
// incremental-build fields that are unsafe to reuse for the probe's own
// program. No tsconfig means an empty options object.
export const compilerOptionsFromTsConfig = (
  ts: DriftTypeScript,
  root: string,
): TsConfigCompilerOptions => {
  const readFile = (path: string): string | undefined => ts.sys.readFile(path)
  const fileExists = (path: string): boolean => ts.sys.fileExists(path)
  const configPath = ts.findConfigFile(root, fileExists, 'tsconfig.json')
  if (configPath === undefined) return {}

  const raw = ts.readConfigFile(configPath, readFile)
  const parsed = ts.parseJsonConfigFileContent(
    raw.config,
    ts.sys,
    dirname(configPath),
  )
  const { tsBuildInfoFile: _ignored, ...rest } = parsed.options
  return rest
}
