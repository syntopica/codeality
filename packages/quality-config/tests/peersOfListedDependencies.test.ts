import { describe, expect, it } from 'vitest'

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { peersOfListedDependencies } from '../src/peersOfListedDependencies'

const installed = (
  dir: string,
  name: string,
  peerDependencies: Record<string, string>,
): void => {
  mkdirSync(join(dir, 'node_modules', name), { recursive: true })
  writeFileSync(
    join(dir, 'node_modules', name, 'package.json'),
    JSON.stringify({ name, peerDependencies }),
  )
}

describe('peersOfListedDependencies', () => {
  it('collects the peers every listed dependency declares', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qc-peers-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        dependencies: { astro: '^7.0.0' },
        devDependencies: { 'eslint-plugin-astro': '^3.0.0' },
      }),
    )
    installed(dir, 'eslint-plugin-astro', { 'typescript-eslint': '>=8' })
    expect([...peersOfListedDependencies(dir)]).toEqual(['typescript-eslint'])
  })

  it('gives nothing without a manifest or an installed dependency', () => {
    const dir = mkdtempSync(join(tmpdir(), 'qc-peers-'))
    expect(peersOfListedDependencies(dir).size).toBe(0)
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ devDependencies: { missing: '1' } }),
    )
    expect(peersOfListedDependencies(dir).size).toBe(0)
  })
})
