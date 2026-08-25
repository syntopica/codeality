import { access, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { baselineScripts } from './baselineScripts.mjs'
import { depCruiserConfig } from './depCruiserConfig.mjs'
import { detectFramework } from './detectFramework.mjs'
import { knipConfig } from './knipConfig.mjs'
import { lefthookConfig } from './lefthookConfig.mjs'
import { renovateConfig } from './renovateConfig.mjs'

// Writes the quality-gate wiring a project is missing and returns what it did.
//
// Never overwrites: a file that exists is the project's, however it got there,
// and a tuned knip config is exactly the thing an adopter spent time on. Same
// for scripts - only names the project does not define are added.
export async function writeMissing(root, deps) {
  const written = []
  const framework = detectFramework(deps)

  const files = [
    ['knip.config.ts', () => knipConfig(framework), ['knip.config.js']],
    ['lefthook.yml', lefthookConfig, []],
    ['renovate.json', renovateConfig, []],
    ['.dependency-cruiser.cjs', depCruiserConfig, ['.dependency-cruiser.js']],
  ]

  for (const [name, render, alternatives] of files) {
    const candidates = [name, ...alternatives]
    let exists = false
    for (const candidate of candidates) {
      try {
        await access(resolve(root, candidate))
        exists = true
        break
      } catch {
        /* not there */
      }
    }
    if (exists) continue
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await writeFile(resolve(root, name), render(), 'utf8')
    written.push(name)
  }

  const manifestPath = resolve(root, 'package.json')
  // Fixed filename under the directory the caller chose to run in, which is
  // the whole point of this tool - not untrusted input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  manifest.scripts ??= {}
  const added = []
  for (const [name, command] of Object.entries(baselineScripts())) {
    if (manifest.scripts[name]) continue
    manifest.scripts[name] = command
    added.push(name)
  }
  if (added.length) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }

  return { framework, written, scripts: added }
}
