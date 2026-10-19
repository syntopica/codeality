import { resolve } from 'node:path'

import { findProjects } from './findProjects.mjs'
import { readText } from './readText.mjs'

const NAMES_LINTS = /^\s+codeality_lints:/m
// codeality_dart's own pubspec takes the lints by path; a tool is not its
// own consumer.
const IS_A_TOOL = /^name:\s*codeality_(?:dart|lints)\s*$/m

/**
 * Every Dart project under `root` whose pubspec.yaml names codeality_lints,
 * under `dev_dependencies` or, wrongly, `dependencies`: conformance reports
 * the second, so the estate has to list it.
 */
export async function findDartConsumers(root, options) {
  return findProjects(
    root,
    async (dir) => {
      const pubspec = await readText(resolve(dir, 'pubspec.yaml'))
      return NAMES_LINTS.test(pubspec) && !IS_A_TOOL.test(pubspec)
    },
    options,
  )
}
