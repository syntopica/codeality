import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { collectDeps } from '../scaffold/collectDeps.mjs'
import { readManifest } from '../scaffold/readManifest.mjs'

const BASELINE_SCOPE = '@busirocket/'

/**
 * Every directory under `root` that depends on a baseline package.
 *
 * One level deep, which is how a projects folder is actually laid out. The
 * alternative - walking the tree - spends most of its time inside
 * `node_modules` finding the baseline packages themselves.
 *
 * Returns `[{ name, path, deps }]` sorted by name, so two runs of the estate
 * report are diffable.
 */
export async function findConsumers(root) {
  let entries
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return []
  }

  const consumers = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const path = resolve(root, entry.name)
    let manifest
    try {
      manifest = await readManifest(path)
    } catch {
      continue
    }
    const deps = collectDeps(manifest)
    if (!Object.keys(deps).some((name) => name.startsWith(BASELINE_SCOPE))) {
      continue
    }
    consumers.push({ name: entry.name, path, deps })
  }

  return consumers.sort((a, b) => a.name.localeCompare(b.name))
}
