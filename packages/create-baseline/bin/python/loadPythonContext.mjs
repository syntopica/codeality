import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { readWorkflows } from '../conformance/readWorkflows.mjs'

/**
 * Everything the Python conformance checks read, gathered once.
 *
 * `pyproject` and `lock` are raw text: the checks look for one dependency
 * name and one pinned version, and a TOML parser would be a dependency
 * carried for two string searches.
 */
export async function loadPythonContext(root, versions) {
  return {
    root,
    versions,
    pyproject: await readText(resolve(root, 'pyproject.toml')),
    lock: await readText(resolve(root, 'uv.lock')),
    workflows: await readWorkflows(root),
  }
}

async function readText(path) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}
