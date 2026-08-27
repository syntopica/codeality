import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { ciWorkflow } from '../bin/scaffold/ciWorkflow.mjs'
import { readManifest } from '../bin/scaffold/readManifest.mjs'

const TEMPLATES = fileURLToPath(new URL('../../../templates', import.meta.url))

// The templates ship the workflow so a copied template is gated from its first
// commit, and `create-baseline --write` renders the same file for a repository
// that already exists. Two producers of one file is two chances to drift, so
// the shipped copies are asserted against the renderer rather than trusted.
const names = (await readdir(TEMPLATES, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

describe('templates ship the rendered CI workflow', () => {
  it.each(names)('%s', async (name) => {
    const dir = `${TEMPLATES}/${name}`
    const manifest = await readManifest(dir)
    const shipped = await readFile(`${dir}/.github/workflows/ci.yml`, 'utf8')
    expect(shipped).toBe(
      ciWorkflow({ hasBuild: Boolean(manifest.scripts?.build) }),
    )
  })
})
