import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

import { findProjects } from './findProjects.mjs'
import { readText } from './readText.mjs'

const IS_THE_TOOL = /^module\s+\S+\/codeality-go$/m

/** Every module under `root` holding a `codeality-go.yaml`. */
export async function findGoConsumers(root, options) {
  return findProjects(
    root,
    async (dir) => {
      try {
        await access(resolve(dir, 'codeality-go.yaml'))
      } catch {
        return false
      }
      return !IS_THE_TOOL.test(await readText(resolve(dir, 'go.mod')))
    },
    options,
  )
}
