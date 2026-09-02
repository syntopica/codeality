import { access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

/**
 * The nearest ancestor holding `.git`, or the project itself.
 *
 * A Python project nested inside a repository keeps its workflow at that
 * repository's root, because GitHub reads workflows nowhere else; the check
 * has to look where the workflow can actually be.
 */
export async function repositoryRoot(root) {
  let dir = root
  for (;;) {
    try {
      await access(resolve(dir, '.git'))
      return dir
    } catch {
      /* keep climbing */
    }
    const parent = dirname(dir)
    if (parent === dir) return root
    dir = parent
  }
}
