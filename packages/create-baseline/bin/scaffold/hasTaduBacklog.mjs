import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

// A format 2 backlog is `todo/tadu.json`; a format 1 backlog is `TODO.md`.
const MARKERS = ['todo/tadu.json', 'TODO.md']

/** Whether the repository at `root` keeps a tadu backlog in git. */
export async function hasTaduBacklog(root) {
  for (const marker of MARKERS) {
    try {
      await access(resolve(root, marker))
      return true
    } catch {
      /* not there */
    }
  }
  return false
}
