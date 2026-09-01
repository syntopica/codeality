import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * Every workflow under `.github/workflows`, as `{ name, text }`.
 *
 * Shared by the JavaScript and the Python conformance passes: the questions
 * they ask of a workflow differ, the way they read one does not.
 */
export async function readWorkflows(root) {
  const dir = resolve(root, '.github/workflows')
  let names
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    names = (await readdir(dir)).filter((name) => /\.ya?ml$/.test(name))
  } catch {
    return []
  }
  const workflows = []
  for (const name of names) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      workflows.push({ name, text: await readFile(resolve(dir, name), 'utf8') })
    } catch {
      /* unreadable file is not a workflow */
    }
  }
  return workflows
}
