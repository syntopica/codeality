import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { checkDartPins } from '../bin/dart/checkDartPins.mjs'
import { checkGateJobs } from '../bin/dart/checkGateJobs.mjs'
import { checkLintsDependency } from '../bin/dart/checkLintsDependency.mjs'
import { runDartConformance } from '../bin/dart/runDartConformance.mjs'
import { findDartConsumers } from '../bin/estate/findDartConsumers.mjs'
import { formatDartEstate } from '../bin/estate/formatDartEstate.mjs'

const VERSIONS = { codeality_dart: '0.1.0', codeality_lints: '0.1.0' }
const PUBSPEC = `name: demo
environment:
  sdk: ^3.13.0
dev_dependencies:
  codeality_lints: ^0.1.0
  test: ^1.33.0
`
const job = (id) => `  ${id}:
    name: codeality-dart
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - name: Install codeality-dart
        run: dart pub global activate codeality_dart 0.1.0
      - name: Run the gate
        run: dart pub global run codeality_dart gate
`
const workflow = (...ids) =>
  `name: codeality\non:\n  workflow_call:\npermissions:\n  contents: read\njobs:\n${ids.map(job).join('')}`

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'codeality-dart-estate-'))
})

const project = async (path, files) => {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(join(root, path, name, '..'), { recursive: true })
    await writeFile(join(root, path, name), text)
  }
}

describe('findDartConsumers', () => {
  it('finds nested projects and skips the tools themselves', async () => {
    await project('app/apps/mobile', { 'pubspec.yaml': PUBSPEC })
    await project('flat', { 'pubspec.yaml': PUBSPEC })
    await project('other', { 'pubspec.yaml': 'name: other\n' })
    await project('baseline/packages/codeality-dart', {
      'pubspec.yaml': `name: codeality_dart\ndev_dependencies:\n  codeality_lints:\n    path: ../x\n`,
    })
    const found = await findDartConsumers(root)
    expect(found.map((c) => c.name)).toEqual(['app/apps/mobile', 'flat'])
  })

  it('lists a project carrying the lints under dependencies', async () => {
    await project('runtime', {
      'pubspec.yaml':
        'name: runtime\ndependencies:\n  codeality_lints: ^0.1.0\n',
    })
    expect((await findDartConsumers(root)).map((c) => c.name)).toEqual([
      'runtime',
    ])
  })
})

describe('checkLintsDependency', () => {
  it('passes the lints as a dev dependency', () => {
    expect(checkLintsDependency({ pubspec: PUBSPEC })).toEqual([])
  })

  it('flags the lints declared as a runtime dependency', () => {
    const pubspec = 'name: x\ndependencies:\n  codeality_lints: ^0.1.0\n'
    expect(checkLintsDependency({ pubspec }).map((f) => f.id)).toEqual([
      'dart-lints-not-dev-dependency',
    ])
  })
})

describe('checkGateJobs', () => {
  it('names the project whose job is missing from codeality.yml', () => {
    const findings = checkGateJobs({
      jobId: 'dart-packages-core',
      projectPath: 'packages/core',
      codealityWorkflow: workflow('dart-apps-mobile', 'dart-packages-ui'),
    })
    expect(findings.map((f) => f.id)).toEqual(['dart-gate-job-missing'])
    expect(findings[0].message).toContain('packages/core')
  })

  it('passes when the job is present', () => {
    const codealityWorkflow = workflow('dart-apps-mobile')
    expect(
      checkGateJobs({ jobId: 'dart-apps-mobile', codealityWorkflow }),
    ).toEqual([])
  })
})

describe('checkDartPins', () => {
  it('reports a git-ref pin as not released instead of crashing', () => {
    const pubspec = `name: x
dev_dependencies:
  codeality_lints:
    git:
      url: https://github.com/syntopica/codeality
      path: packages/codeality-dart-lints
      ref: codeality_lints-v0.1.0
`
    const codealityWorkflow = workflow('dart').replace(
      'activate codeality_dart 0.1.0',
      'activate --source git https://github.com/syntopica/codeality --git-path packages/codeality-dart --git-ref codeality_dart-v0.1.0',
    )
    const ids = checkDartPins({
      pubspec,
      codealityWorkflow,
      versions: VERSIONS,
    })
    expect(ids.map((f) => f.id)).toEqual([
      'dart-pin-not-released',
      'dart-pin-not-released',
    ])
  })

  it('names a stale release', () => {
    const pubspec = PUBSPEC.replace('^0.1.0', '^0.0.9')
    const [finding] = checkDartPins({
      pubspec,
      codealityWorkflow: workflow('dart'),
      versions: VERSIONS,
    })
    expect(finding.id).toBe('dart-pin-outdated')
    expect(finding.message).toContain('0.0.9')
  })
})

describe('runDartConformance', () => {
  it('reads a wired project nested in a repository as clean', async () => {
    await mkdir(join(root, 'repo', '.git'), { recursive: true })
    await project('repo', {
      '.github/workflows/codeality.yml': workflow('dart-apps-mobile'),
    })
    await project('repo/apps/mobile', { 'pubspec.yaml': PUBSPEC })
    const { findings } = await runDartConformance(
      join(root, 'repo', 'apps', 'mobile'),
      VERSIONS,
    )
    expect(findings).toEqual([])
  })

  it('a monorepo missing one job flags only that project', async () => {
    await mkdir(join(root, 'mono', '.git'), { recursive: true })
    await project('mono', {
      '.github/workflows/codeality.yml': workflow('dart-a', 'dart-b'),
    })
    for (const name of ['a', 'b', 'c']) {
      await project(`mono/${name}`, { 'pubspec.yaml': PUBSPEC })
    }
    const ids = async (name) =>
      (
        await runDartConformance(join(root, 'mono', name), VERSIONS)
      ).findings.map((f) => f.id)
    expect(await ids('a')).toEqual([])
    expect(await ids('c')).toEqual(['dart-gate-job-missing'])
  })
})

describe('formatDartEstate', () => {
  it('shows one column per class of wiring', () => {
    const table = formatDartEstate([
      { name: 'wired', findings: [] },
      { name: 'unjobbed', findings: [{ id: 'dart-gate-job-missing' }] },
    ])
    expect(table).toContain('wired       ok     ok     ok     ok')
    expect(table).toContain('unjobbed    ok     FAIL   ok     ok')
    expect(table).toContain('2 Dart projects, 1 fully wired.')
  })
})
