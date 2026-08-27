import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { loadContext } from '../bin/conformance/loadContext.mjs'
import { runConformance } from '../bin/conformance/runConformance.mjs'
import { checkPeers } from '../bin/scaffold/checkPeers.mjs'
import { composedSubpaths } from '../bin/scaffold/composedSubpaths.mjs'
import { workspaceRoots } from '../bin/scaffold/workspaceRoots.mjs'
import { writeCiWorkflow } from '../bin/scaffold/writeCiWorkflow.mjs'
import { writeMissing } from '../bin/scaffold/writeMissing.mjs'

const VERSIONS = { '@busirocket/prettier-config': '^0.2.0' }
const TODAY = '2026-08-27'

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'baseline-repo-'))
})

const manifest = (value) =>
  writeFile(join(root, 'package.json'), JSON.stringify(value, null, 2))

const workflow = async (name, text) => {
  await mkdir(join(root, '.github/workflows'), { recursive: true })
  await writeFile(join(root, '.github/workflows', name), text)
}

describe('loadContext', () => {
  it('reads scripts, dependencies, workflows and hook state', async () => {
    await manifest({
      scripts: { lint: 'eslint .' },
      devDependencies: { lefthook: '^2' },
    })
    await workflow('ci.yml', 'run: pnpm run check:ci')

    const context = await loadContext(root, VERSIONS)
    expect(context.scripts.lint).toBe('eslint .')
    expect(context.deps.lefthook).toBe('^2')
    expect(context.workflows).toHaveLength(1)
    expect(context.hooks.installed).toBe(false)
  })

  it('finds the test-runner config among the names in use', async () => {
    await manifest({})
    await writeFile(join(root, 'vitest.config.ts'), 'export default {}')
    const context = await loadContext(root, VERSIONS)
    expect(context.testConfig.name).toBe('vitest.config.ts')
  })

  // A monorepo declares the baseline per workspace. Reading only the root
  // manifest reports every package missing, which is how a repo running the
  // whole toolchain was told it had none of it.
  it('collects dependencies from workspaces as well as the root', async () => {
    await manifest({ workspaces: ['packages/*'] })
    await mkdir(join(root, 'packages/one'), { recursive: true })
    await writeFile(
      join(root, 'packages/one/package.json'),
      JSON.stringify({
        devDependencies: { '@busirocket/prettier-config': '^0.2.0' },
      }),
    )
    const context = await loadContext(root, VERSIONS)
    expect(context.deps['@busirocket/prettier-config']).toBe('^0.2.0')
  })

  it('treats a repository with no workflow directory as having none', async () => {
    await manifest({})
    expect((await loadContext(root, VERSIONS)).workflows).toEqual([])
  })
})

describe('workspaceRoots', () => {
  it('reads pnpm workspace globs', async () => {
    await manifest({})
    await writeFile(
      join(root, 'pnpm-workspace.yaml'),
      "packages:\n  - 'packages/*'\n",
    )
    await mkdir(join(root, 'packages/a'), { recursive: true })
    const roots = await workspaceRoots(root)
    expect(roots.map((p) => p.split('/').pop())).toEqual(['a'])
  })

  it('returns nothing for a single-package repository', async () => {
    await manifest({})
    expect(await workspaceRoots(root)).toEqual([])
  })
})

describe('writeCiWorkflow', () => {
  it('writes a workflow when the repository has none', async () => {
    const result = await writeCiWorkflow(root, { hasBuild: false })
    expect(result.written).toBe('.github/workflows/ci.yml')
  })

  // Matching on the command rather than the filename: a gate job in
  // `verify.yml` is wired, and writing a second workflow beside it would run
  // every gate twice on every push.
  it('leaves a repository whose workflow already runs the gates alone', async () => {
    await workflow(
      'verify.yml',
      'on:\n  push:\n      - run: pnpm run check:ci\n',
    )
    const result = await writeCiWorkflow(root, { hasBuild: false })
    expect(result.written).toBeNull()
    expect(result.existing).toBe('verify.yml')
  })

  it('refuses to add a second pipeline beside an unrelated one', async () => {
    await workflow('deploy.yml', '      - run: ./deploy.sh\n')
    const result = await writeCiWorkflow(root, { hasBuild: false })
    expect(result.written).toBeNull()
    expect(result.partial).toEqual(['deploy.yml'])
  })
})

describe('writeMissing', () => {
  it('scaffolds the wiring a bare project is missing', async () => {
    await manifest({ name: 'x', scripts: { build: 'vite build' } })
    const result = await writeMissing(root, { react: '^19' })

    expect(result.framework).toBe('vite-react')
    expect(result.written).toContain('knip.config.ts')
    expect(result.written).toContain('lefthook.yml')
    expect(result.written).toContain('.github/workflows/ci.yml')
    expect(result.scripts).toContain('check:ci')

    const written = JSON.parse(
      await readFile(join(root, 'package.json'), 'utf8'),
    )
    expect(written.scripts.build).toBe('vite build')
    expect(written.scripts['check:quality']).toContain('type-coverage')
  })

  // consumer-m carried a knip.json that scanned almost nothing.
  // This tool wrote knip.config.ts beside it, knip went on loading the json,
  // and the gate stayed broken while looking configured.
  it('reports a config file that shadows the one it would write', async () => {
    await manifest({ name: 'x' })
    await writeFile(join(root, 'knip.json'), '{}')
    const result = await writeMissing(root, {})
    expect(result.shadowed).toContainEqual(['knip.json', 'knip.config.ts'])
    expect(result.written).not.toContain('knip.config.ts')
  })

  it('never overwrites a script the project already defines', async () => {
    await manifest({ name: 'x', scripts: { knip: 'knip --production' } })
    await writeMissing(root, {})
    const written = JSON.parse(
      await readFile(join(root, 'package.json'), 'utf8'),
    )
    expect(written.scripts.knip).toBe('knip --production')
  })
})

describe('composedSubpaths', () => {
  it('reads the subpaths a flat config actually imports', async () => {
    await writeFile(
      join(root, 'eslint.config.ts'),
      "import { createBaseConfig } from '@busirocket/eslint-config/base'\n" +
        "import { createNodeConfig } from '@busirocket/eslint-config/node'\n",
    )
    expect((await composedSubpaths(root)).sort()).toEqual(['base', 'node'])
  })

  it('returns nothing when there is no flat config', async () => {
    expect(await composedSubpaths(root)).toEqual([])
  })
})

describe('checkPeers', () => {
  it('reports nothing to compare when the config is not installed', async () => {
    await manifest({})
    expect(await checkPeers(root)).toBeNull()
  })
})

describe('runConformance', () => {
  it('reports a bare repository as unwired, worst first', async () => {
    await manifest({ scripts: { lint: 'eslint .' } })
    const { findings } = await runConformance(root, VERSIONS, TODAY)
    const ids = findings.map((f) => f.id)
    expect(ids[0]).toBe('lint-flag')
    expect(ids).toContain('ci-workflow')
    expect(ids).toContain('check-entrypoints')
  })

  it('moves a waived finding out of the failing set', async () => {
    await manifest({ scripts: { lint: 'eslint .' } })
    await writeFile(
      join(root, 'baseline.exceptions.json'),
      JSON.stringify({ 'lint-flag': { reason: 'migrating' } }),
    )
    const { findings, waived } = await runConformance(root, VERSIONS, TODAY)
    expect(findings.map((f) => f.id)).not.toContain('lint-flag')
    expect(waived.map((f) => f.id)).toEqual(['lint-flag'])
  })

  it('passes a repository that is wired end to end', async () => {
    await manifest({
      scripts: {
        lint: 'eslint . --max-warnings 0',
        'type-check': 'tsc --noEmit',
        'format:check': 'prettier --check .',
        test: 'vitest run --coverage',
        dupes: 'baseline-dupes .',
        knip: 'knip',
        'deps:graph': 'depcruise src',
        'type-coverage': 'baseline-type-coverage',
        'secrets:check': 'gitleaks detect',
        'audit:check': 'pnpm audit --audit-level=high',
        'check:ci':
          'pnpm type-check && pnpm lint && pnpm format:check && pnpm test && pnpm dupes && pnpm knip',
        'check:quality': 'pnpm deps:graph && pnpm type-coverage',
        'check:security': 'pnpm secrets:check && pnpm audit:check',
      },
      devDependencies: {
        '@busirocket/prettier-config': '^0.2.0',
        lefthook: '^2',
      },
    })
    await writeFile(
      join(root, 'vitest.config.ts'),
      'export default { test: { coverage: { thresholds: { lines: 80 } } } }',
    )
    await workflow(
      'ci.yml',
      'on:\n  push:\n    branches: [main]\n' +
        '      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6\n' +
        '      - run: pnpm run check:ci\n' +
        '      - run: pnpm run check:quality\n' +
        '      - run: pnpm run check:security\n',
    )
    await mkdir(join(root, '.git/hooks'), { recursive: true })
    await writeFile(join(root, '.git/hooks/pre-commit'), '#!/bin/sh\n')

    const { findings } = await runConformance(root, VERSIONS, TODAY)
    expect(findings).toEqual([])
  })
})

describe('workspaceRoots pnpm parsing', () => {
  const yaml = async (text) => {
    await writeFile(join(root, 'pnpm-workspace.yaml'), text)
    await manifest({})
  }

  it('reads a quoted list', async () => {
    await yaml('packages:\n  - \'packages/*\'\n  - "apps/*"\n')
    await mkdir(join(root, 'packages/a'), { recursive: true })
    await mkdir(join(root, 'apps/b'), { recursive: true })
    const names = (await workspaceRoots(root)).map((p) => p.split('/').pop())
    expect(names.sort()).toEqual(['a', 'b'])
  })

  it('tolerates blank lines and comments inside the block', async () => {
    await yaml("packages:\n  # the libraries\n\n  - 'packages/*'\n")
    await mkdir(join(root, 'packages/a'), { recursive: true })
    expect(await workspaceRoots(root)).toHaveLength(1)
  })

  // The block ends at the next top-level key; a value under it is not a glob.
  it('stops at the next top-level key', async () => {
    await yaml(
      "packages:\n  - 'packages/*'\nonlyBuiltDependencies:\n  - esbuild\n",
    )
    await mkdir(join(root, 'packages/a'), { recursive: true })
    await mkdir(join(root, 'esbuild'), { recursive: true })
    expect(await workspaceRoots(root)).toHaveLength(1)
  })

  it('returns nothing when the file has no packages block', async () => {
    await yaml('onlyBuiltDependencies:\n  - esbuild\n')
    expect(await workspaceRoots(root)).toEqual([])
  })
})
