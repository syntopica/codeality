import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// The `@busirocket/eslint-config` subpaths a project's flat config imports.
//
// Read from the file rather than inferred from dependencies: a repo can carry
// Tailwind without composing `/tailwind`, and the peers that matter are the
// ones its config actually reaches for.
export async function composedSubpaths(root) {
  let names
  try {
    // The directory the caller chose to run in, which is the point of this
    // tool - not untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    names = await readdir(root)
  } catch {
    return []
  }
  const config = names.find((name) => /^eslint\.config\.[cm]?[jt]s$/.test(name))
  if (!config) return []

  let source
  try {
    // A fixed filename in the directory the caller chose to run in.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    source = await readFile(resolve(root, config), 'utf8')
  } catch {
    return []
  }

  const found = new Set()
  for (const match of source.matchAll(
    /@busirocket\/eslint-config\/([a-z-]+)/g,
  )) {
    found.add(match[1])
  }
  // A bare `@busirocket/eslint-config` import is the barrel, which composes
  // the base layer.
  if (/@busirocket\/eslint-config['"]/.test(source)) found.add('base')
  return [...found]
}
