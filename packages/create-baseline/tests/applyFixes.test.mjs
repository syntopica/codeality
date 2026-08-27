import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { applyFixes } from '../bin/conformance/applyFixes.mjs'

let root

const manifest = (value) =>
  writeFile(join(root, 'package.json'), JSON.stringify(value, null, 2))

const readManifest = async () =>
  JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'baseline-fixes-'))
})

describe('applyFixes', () => {
  it('rewrites a script in place', async () => {
    await manifest({ scripts: { lint: 'eslint .' } })
    await applyFixes(root, [
      {
        fix: {
          kind: 'set-script',
          name: 'lint',
          value: 'eslint . --max-warnings 0',
        },
      },
    ])
    expect((await readManifest()).scripts.lint).toBe(
      'eslint . --max-warnings 0',
    )
  })

  it('appends a missing gate to an existing entrypoint', async () => {
    await manifest({ scripts: { 'check:quality': 'pnpm deps:graph' } })
    await applyFixes(root, [
      {
        fix: {
          kind: 'append-to-script',
          name: 'check:quality',
          value: 'pnpm type-coverage',
        },
      },
    ])
    expect((await readManifest()).scripts['check:quality']).toBe(
      'pnpm deps:graph && pnpm type-coverage',
    )
  })

  it('creates the entrypoint when appending to one that does not exist', async () => {
    await manifest({ scripts: {} })
    await applyFixes(root, [
      {
        fix: {
          kind: 'append-to-script',
          name: 'check:security',
          value: 'pnpm secrets:check',
        },
      },
    ])
    expect((await readManifest()).scripts['check:security']).toBe(
      'pnpm secrets:check',
    )
  })

  it('widens a dependency range in the field it already lives in', async () => {
    await manifest({ dependencies: { '@busirocket/tsconfig': '^0.2.0' } })
    await applyFixes(root, [
      {
        fix: {
          kind: 'set-dependency',
          name: '@busirocket/tsconfig',
          value: '^0.2.1',
        },
      },
    ])
    const after = await readManifest()
    expect(after.dependencies['@busirocket/tsconfig']).toBe('^0.2.1')
    expect(after.devDependencies).toBeUndefined()
  })

  it('writes the CI workflow', async () => {
    await manifest({ scripts: { build: 'vite build' } })
    const applied = await applyFixes(root, [
      { fix: { kind: 'write-workflow' } },
    ])
    expect(applied[0]).toContain('.github/workflows/ci.yml')
    const yml = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8')
    expect(yml).toContain('pnpm run check:ci')
    expect(yml).toContain('pnpm run build')
  })

  it('inserts a self-raising threshold block into a vitest config', async () => {
    const path = join(root, 'vitest.config.ts')
    await manifest({})
    await writeFile(
      path,
      'export default {\n  coverage: {\n    provider: "v8",\n  },\n}\n',
    )
    await applyFixes(root, [
      { fix: { kind: 'insert-coverage-thresholds', path } },
    ])
    const after = await readFile(path, 'utf8')
    expect(after).toContain('autoUpdate: true')
    expect(after).toContain('lines: 0')
  })

  it('ignores findings that carry no fix', async () => {
    await manifest({ scripts: { lint: 'eslint .' } })
    expect(await applyFixes(root, [{ id: 'x' }])).toEqual([])
  })
})
