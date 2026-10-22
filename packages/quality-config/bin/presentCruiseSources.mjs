import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function presentCruiseSources(workspace, sources) {
  const present = []
  for (const directory of sources) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Source paths are selected by the invoking CLI; this call only probes their existence.
    if (existsSync(resolve(workspace, directory))) present.push(directory)
  }
  return present
}
