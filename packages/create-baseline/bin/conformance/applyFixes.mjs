import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { writeCiWorkflow } from '../scaffold/writeCiWorkflow.mjs'

const THRESHOLDS = `      thresholds: {
        // vitest's own ratchet: the first run with --coverage raises each
        // value to what the suite actually reaches and writes it back here.
        // Entering an existing repository at a flat 80 turns the build red on
        // day one, and a gate that starts red gets deleted rather than met.
        autoUpdate: true,
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
`

/**
 * Applies the mechanical half of a conformance report.
 *
 * Only findings that carry a `fix` are touched, and only the kinds below.
 * Everything else is left for a human: a missing test suite, a workflow that
 * runs some entrypoints but not others, and an action pinned to a tag all
 * need a decision this tool does not have.
 *
 * Returns the list of changes made, in the order they were applied.
 */
export async function applyFixes(root, findings) {
  const applied = []
  const manifestPath = resolve(root, 'package.json')
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  let manifestDirty = false

  for (const finding of findings) {
    const fix = finding.fix
    if (!fix) continue

    if (fix.kind === 'set-script') {
      manifest.scripts ??= {}
      manifest.scripts[fix.name] = fix.value
      manifestDirty = true
      applied.push(`scripts.${fix.name} = ${fix.value}`)
      continue
    }

    if (fix.kind === 'append-to-script') {
      manifest.scripts ??= {}
      const current = manifest.scripts[fix.name]
      // Appending the same command twice never helps: when a fix re-fires
      // (two findings sharing a target, or a re-run before the gate goes
      // green) the entrypoint must not accumulate duplicates.
      if (current?.split(' && ').includes(fix.value)) continue
      manifest.scripts[fix.name] = current
        ? `${current} && ${fix.value}`
        : fix.value
      manifestDirty = true
      applied.push(`scripts.${fix.name} += ${fix.value}`)
      continue
    }

    if (fix.kind === 'set-dependency') {
      const field = manifest.devDependencies?.[fix.name]
        ? 'devDependencies'
        : manifest.dependencies?.[fix.name]
          ? 'dependencies'
          : 'devDependencies'
      manifest[field] ??= {}
      manifest[field][fix.name] = fix.value
      manifestDirty = true
      applied.push(`${field}.${fix.name} = ${fix.value}`)
      continue
    }

    if (fix.kind === 'write-workflow') {
      const result = await writeCiWorkflow(root, {
        hasBuild: Boolean(manifest.scripts?.build),
      })
      if (result.written) applied.push(`wrote ${result.written}`)
      continue
    }

    if (fix.kind === 'insert-coverage-thresholds') {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const text = await readFile(fix.path, 'utf8')
      const patched = text.replace(/(\bcoverage\s*:\s*\{\n)/, `$1${THRESHOLDS}`)
      if (patched === text) continue
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await writeFile(fix.path, patched, 'utf8')
      applied.push(`added coverage thresholds to ${fix.path}`)
    }
  }

  if (manifestDirty) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  }

  return applied
}
