import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

import { findProjects } from './findProjects.mjs'
import { readText } from './readText.mjs'

const IS_THE_TOOL = /name:\s*"codeality-swift"/

/** Every project under `root` holding a `codeality-swift.yaml`. */
export async function findSwiftConsumers(root, options) {
  return findProjects(
    root,
    async (dir) => {
      try {
        await access(resolve(dir, 'codeality-swift.yaml'))
      } catch {
        return false
      }
      return !IS_THE_TOOL.test(await readText(resolve(dir, 'Package.swift')))
    },
    options,
  )
}
