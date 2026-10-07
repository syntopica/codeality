import { describe, expect, it } from 'vitest'

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createKnipConfig } from '../src/knip'

const emptyProject = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'qc-knip-'))
  writeFileSync(join(dir, 'package.json'), '{}')
  return dir
}

describe('createKnipConfig', () => {
  it('keeps the preset entry when the caller names none', () => {
    const config = createKnipConfig({
      framework: 'ts-package',
      cwd: emptyProject(),
    })
    expect(config.entry).toEqual(['src/index.ts'])
  })

  it('replaces a missing default entry with the caller entry', () => {
    const config = createKnipConfig({
      framework: 'ts-package',
      entry: ['src/cli/main.ts'],
      cwd: emptyProject(),
    })
    expect(config.entry).toEqual(['src/cli/main.ts'])
  })

  it('merges the caller entry with an existing default entry', () => {
    const dir = emptyProject()
    mkdirSync(join(dir, 'src'))
    writeFileSync(join(dir, 'src/index.ts'), '')
    const config = createKnipConfig({
      framework: 'ts-package',
      entry: ['src/cli/main.ts'],
      cwd: dir,
    })
    expect(config.entry).toEqual(['src/index.ts', 'src/cli/main.ts'])
  })
})
