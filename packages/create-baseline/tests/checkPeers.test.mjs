import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { checkPeers } from '../bin/scaffold/checkPeers.mjs'

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'baseline-peers-'))
})

// A package as it appears in the project's node_modules. Read from the
// directory rather than through require.resolve: these packages define
// `exports` without a `./package.json` entry, so resolving throws while the
// package is installed and working.
const install = async (name, manifest) => {
  const dir = join(root, 'node_modules', name)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'package.json'), JSON.stringify(manifest))
}

const config = (peerDependencies) =>
  install('@busirocket/eslint-config', { version: '0.7.3', peerDependencies })

const flatConfig = (source) => writeFile(join(root, 'eslint.config.ts'), source)

const BASE =
  "import { createBaseConfig } from '@busirocket/eslint-config/base'\n"

describe('checkPeers', () => {
  it('returns null when the config is not installed', async () => {
    expect(await checkPeers(root)).toBeNull()
  })

  it('passes when every peer the composed subpaths need is present', async () => {
    await config({ 'eslint-plugin-import': '>=2.32.0' })
    await flatConfig(BASE)
    await install('eslint-plugin-import', { version: '2.32.0' })
    expect(await checkPeers(root)).toEqual({ missing: [], mismatched: [] })
  })

  it('reports a peer the composed subpath needs and the project lacks', async () => {
    await config({ 'eslint-plugin-import': '>=2.32.0' })
    await flatConfig(BASE)
    const { missing } = await checkPeers(root)
    expect(missing).toEqual([
      { name: 'eslint-plugin-import', range: '>=2.32.0' },
    ])
  })

  // A repo can carry a plugin the config declares without composing the
  // subpath that reaches for it; that is not a missing peer.
  it('ignores a peer no composed subpath reaches for', async () => {
    await config({ 'eslint-plugin-react': '>=7.37.0' })
    await flatConfig(BASE)
    expect((await checkPeers(root)).missing).toEqual([])
  })

  it('reports an installed peer that is too old for the declared range', async () => {
    await config({ 'eslint-plugin-import': '>=2.32.0' })
    await flatConfig(BASE)
    await install('eslint-plugin-import', { version: '2.31.0' })
    const { mismatched } = await checkPeers(root)
    expect(mismatched).toEqual([
      { name: 'eslint-plugin-import', range: '>=2.32.0', version: '2.31.0' },
    ])
  })

  it('reads a caret range as major-locked', async () => {
    await config({ 'eslint-plugin-import': '^2.32.0' })
    await flatConfig(BASE)
    await install('eslint-plugin-import', { version: '3.0.0' })
    expect((await checkPeers(root)).mismatched).toHaveLength(1)
  })

  // A prerelease does not satisfy a stable range: `4.0.0-beta.1` sorts below
  // `4.0.0` and ships different rules.
  it('does not accept a prerelease against a stable range', async () => {
    await config({ 'eslint-plugin-import': '>=2.32.0' })
    await flatConfig(BASE)
    await install('eslint-plugin-import', { version: '2.33.0-beta.1' })
    expect((await checkPeers(root)).mismatched).toHaveLength(1)
  })

  // typescript and eslint are the project's own choice, not the config's.
  it('skips typescript and eslint', async () => {
    await config({ typescript: '>=5.4.0', eslint: '>=10.0.0' })
    await flatConfig(BASE)
    expect(await checkPeers(root)).toEqual({ missing: [], mismatched: [] })
  })

  it('does not guess at a range shape it cannot parse', async () => {
    await config({ 'eslint-plugin-import': '2.x || 3.x' })
    await flatConfig(BASE)
    await install('eslint-plugin-import', { version: '2.32.0' })
    expect((await checkPeers(root)).mismatched).toEqual([])
  })
})
