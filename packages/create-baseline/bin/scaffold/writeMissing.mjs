import { access, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { baselineScripts } from './baselineScripts.mjs'
import { depCruiserConfig } from './depCruiserConfig.mjs'
import { detectFramework } from './detectFramework.mjs'
import { knipConfig } from './knipConfig.mjs'
import { lefthookConfig } from './lefthookConfig.mjs'
import { oxlintConfig } from './oxlintConfig.mjs'
import { renovateConfig } from './renovateConfig.mjs'
import { writeCiWorkflow } from './writeCiWorkflow.mjs'

// Writes the quality-gate wiring a project is missing and returns what it did.
//
// Never overwrites: a file that exists is the project's, however it got there,
// and a tuned knip config is exactly the thing an adopter spent time on. Same
// for scripts - only names the project does not define are added.
//
// `alternatives` is every other filename the tool itself would load, not a
// guess. Miss one and the write is worse than useless: consumer-m
// carried a `knip.json` that set `project` to `["tsconfig.json"]`, so knip
// scanned almost nothing and called 34 live dependencies unused. This tool
// wrote `knip.config.ts` next to it, knip went on loading the json, and the
// gate stayed broken while looking configured. A shadowed file is reported by
// name rather than skipped in silence.
export async function writeMissing(root, deps) {
  const written = []
  const shadowed = []
  const framework = detectFramework(deps)

  const files = [
    [
      'knip.config.ts',
      () => knipConfig(framework),
      [
        'knip.config.js',
        'knip.config.mjs',
        'knip.config.cjs',
        'knip.json',
        'knip.jsonc',
        '.knip.json',
        '.knip.jsonc',
      ],
    ],
    ['lefthook.yml', lefthookConfig, ['lefthook.yaml', '.lefthook.yml']],
    ['.oxlintrc.json', oxlintConfig, ['oxlint.json', '.oxlintrc']],
    [
      'renovate.json',
      renovateConfig,
      [
        'renovate.json5',
        '.renovaterc',
        '.renovaterc.json',
        '.github/renovate.json',
        '.github/renovate.json5',
      ],
    ],
    [
      '.dependency-cruiser.cjs',
      depCruiserConfig,
      [
        '.dependency-cruiser.js',
        '.dependency-cruiser.mjs',
        '.dependency-cruiser.json',
        '.dependency-cruiser.jsonc',
      ],
    ],
  ]

  for (const [name, render, alternatives] of files) {
    let found
    for (const candidate of [name, ...alternatives]) {
      try {
        await access(resolve(root, candidate))
        found = candidate
        break
      } catch {
        /* not there */
      }
    }
    if (found) {
      if (found !== name) shadowed.push([found, name])
      continue
    }
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

  // Last, and after the scripts: the workflow it writes calls `check:ci`,
  // `check:quality` and `check:security`, so writing it before those exist
  // would produce a pipeline whose first run fails on a missing script.
  const workflow = await writeCiWorkflow(root, {
    hasBuild: Boolean(manifest.scripts.build),
  })
  if (workflow.written) written.push(workflow.written)

  return { framework, written, shadowed, scripts: added, workflow }
}
