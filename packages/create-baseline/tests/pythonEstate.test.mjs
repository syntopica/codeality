import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { findPythonConsumers } from '../bin/estate/findPythonConsumers.mjs'
import { formatPythonEstate } from '../bin/estate/formatPythonEstate.mjs'
import { checkGateWorkflow } from '../bin/python/checkGateWorkflow.mjs'
import { checkLockPin } from '../bin/python/checkLockPin.mjs'
import { checkQualityGroup } from '../bin/python/checkQualityGroup.mjs'
import { runPythonConformance } from '../bin/python/runPythonConformance.mjs'

const VERSIONS = { 'busirocket-baseline-py': '0.1.9' }
const PYPROJECT = `[project]
name = "demo"

[dependency-groups]
quality = [
  "busirocket-baseline-py>=0.1,<1",
  "ruff>=0.15,<1",
]
`
const LOCK = `[[package]]
name = "busirocket-baseline-py"
version = "0.1.9"
`
const GATE_WORKFLOW = `on:
  push:
  pull_request:
jobs:
  gate:
    steps:
      - uses: actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6
      - run: uv run baseline-py gate --json
`

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'baseline-python-estate-'))
})

const project = async (path, files) => {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(join(root, path, name, '..'), { recursive: true })
    await writeFile(join(root, path, name), text)
  }
}

describe('findPythonConsumers', () => {
  it('finds projects nested inside a repository about something else', async () => {
    await project('parent-repo/tools/nested-tool', { 'pyproject.toml': PYPROJECT })
    await project('flat', { 'pyproject.toml': PYPROJECT })
    await project('unrelated', { 'pyproject.toml': '[project]\nname = "x"\n' })
    const found = await findPythonConsumers(root)
    expect(found.map((c) => c.name)).toEqual([
      'parent-repo/tools/nested-tool',
      'flat',
    ])
  })

  it('does not report the tool as its own consumer', async () => {
    await project('baseline/packages/baseline-py', {
      'pyproject.toml': '[project]\nname = "busirocket-baseline-py"\n',
    })
    expect(await findPythonConsumers(root)).toEqual([])
  })

  it('stops descending once a project is found', async () => {
    await project('outer', { 'pyproject.toml': PYPROJECT })
    await project('outer/inner', { 'pyproject.toml': PYPROJECT })
    expect((await findPythonConsumers(root)).map((c) => c.name)).toEqual([
      'outer',
    ])
  })

  it('never walks into node_modules, dotfiles or archives', async () => {
    await project('repo/node_modules/pkg', { 'pyproject.toml': PYPROJECT })
    await project('repo/.venv/pkg', { 'pyproject.toml': PYPROJECT })
    await project('_archive/old', { 'pyproject.toml': PYPROJECT })
    expect(await findPythonConsumers(root)).toEqual([])
  })
})

describe('checkQualityGroup', () => {
  it('passes a quality group that carries the tool', () => {
    expect(checkQualityGroup({ pyproject: PYPROJECT })).toEqual([])
  })

  it('reports the tool declared outside the group', () => {
    const pyproject = '[project]\ndependencies = ["busirocket-baseline-py"]\n'
    expect(checkQualityGroup({ pyproject }).map((f) => f.id)).toEqual([
      'py-quality-group',
    ])
  })
})

describe('checkGateWorkflow', () => {
  it('passes a workflow that runs the gate on push', () => {
    const workflows = [{ name: 'quality.yml', text: GATE_WORKFLOW }]
    expect(checkGateWorkflow({ workflows })).toEqual([])
  })

  it('reports a workflow that runs everything but the gate', () => {
    const text =
      'on:\n  push:\njobs:\n  test:\n    steps:\n      - run: pytest\n'
    const found = checkGateWorkflow({ workflows: [{ name: 'ci.yml', text }] })
    expect(found[0].message).toBe('no workflow runs baseline-py gate')
  })

  it('reports a manual-only gate workflow', () => {
    const text =
      'on:\n  workflow_dispatch:\njobs:\n  g:\n    steps:\n      - run: baseline-py gate\n'
    const found = checkGateWorkflow({ workflows: [{ name: 'ci.yml', text }] })
    expect(found[0].message).toMatch(/manual or scheduled/)
  })
})

describe('checkLockPin', () => {
  it('passes a lock on the current release', () => {
    expect(checkLockPin({ lock: LOCK, versions: VERSIONS })).toEqual([])
  })

  it('names the stale pin and the current release', () => {
    const lock = LOCK.replace('0.1.9', '0.1.7')
    const [finding] = checkLockPin({ lock, versions: VERSIONS })
    expect(finding.message).toBe(
      'uv.lock pins busirocket-baseline-py 0.1.7, current is 0.1.9',
    )
  })

  it('reports a missing lock', () => {
    expect(checkLockPin({ lock: '', versions: VERSIONS })[0].message).toBe(
      'no uv.lock',
    )
  })
})

describe('runPythonConformance', () => {
  it('reads a fully wired project as clean', async () => {
    await project('wired', {
      'pyproject.toml': PYPROJECT,
      'uv.lock': LOCK,
      '.github/workflows/quality.yml': GATE_WORKFLOW,
    })
    const { findings } = await runPythonConformance(
      join(root, 'wired'),
      VERSIONS,
    )
    expect(findings).toEqual([])
  })

  it("reads a nested project's workflow from the repository root", async () => {
    await mkdir(join(root, 'repo', '.git'), { recursive: true })
    await project('repo', {
      '.github/workflows/quality-nested-tool.yml': GATE_WORKFLOW,
    })
    await project('repo/tools/nested-tool', {
      'pyproject.toml': PYPROJECT,
      'uv.lock': LOCK,
    })
    const { findings } = await runPythonConformance(
      join(root, 'repo', 'tools', 'nested-tool'),
      VERSIONS,
    )
    expect(findings).toEqual([])
  })

  it('reports an unpinned action through the shared check', async () => {
    await project('tagged', {
      'pyproject.toml': PYPROJECT,
      'uv.lock': LOCK,
      '.github/workflows/quality.yml': GATE_WORKFLOW.replace(
        /checkout@\w+ # v6/,
        'checkout@v6',
      ),
    })
    const { findings } = await runPythonConformance(
      join(root, 'tagged'),
      VERSIONS,
    )
    expect(findings.map((f) => f.id)).toEqual([
      'action-pin:actions/checkout@v6',
    ])
  })
})

describe('formatPythonEstate', () => {
  it('shows one column per class of wiring', () => {
    const table = formatPythonEstate([
      { name: 'wired', findings: [] },
      {
        name: 'local-only',
        findings: [{ id: 'py-ci-workflow', level: 'error' }],
      },
    ])
    expect(table).toContain('wired       ok     ok     ok     ok')
    expect(table).toContain('local-only  ok     FAIL   ok     ok')
    expect(table).toContain('2 Python projects, 1 fully wired.')
  })
})
