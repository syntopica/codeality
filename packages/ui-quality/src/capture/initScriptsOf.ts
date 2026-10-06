import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expectConfig } from '@/config/expectConfig.js'

/** The configured init scripts' source, read once for the whole run. */
export const initScriptsOf = (root: string, paths: string[]): string[] =>
  paths.map((path) => {
    const file = resolve(root, path)
    expectConfig(existsSync(file), `initScripts: ${path} not found in ${root}`)
    return readFileSync(file, 'utf8')
  })
