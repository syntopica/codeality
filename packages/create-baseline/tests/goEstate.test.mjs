import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { findGoConsumers } from '../bin/estate/findGoConsumers.mjs'
import { formatGoEstate } from '../bin/estate/formatGoEstate.mjs'
import { checkGoGateJob } from '../bin/go/checkGoGateJob.mjs'
import { checkGoPin } from '../bin/go/checkGoPin.mjs'
import { goJobId } from '../bin/go/goJobId.mjs'
import { runGoConformance } from '../bin/go/runGoConformance.mjs'

const VERSIONS = { 'codeality-go': '0.1.0' }
const CONFIG = 'schema-version: 1\n'
const TOOL = 'github.com/syntopica/codeality/packages/codeality-go'
const WORKFLOW = `name: codeality
on:
  workflow_call:
jobs:
  go-services-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - run: go install ${TOOL}/cmd/codeality-go@v0.1.0
      - run: codeality-go gate
`

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'codeality-go-estate-'))
})

const project = async (path, files) => {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(join(root, path, name, '..'), { recursive: true })
    await writeFile(join(root, path, name), text)
  }
}

describe('findGoConsumers', () => {
  it('finds configured modules and skips the tool itself', async () => {
    await project('app', {
      'codeality-go.yaml': CONFIG,
      'go.mod': 'module example.com/app\n',
    })
    await project('baseline/packages/codeality-go', {
      'codeality-go.yaml': CONFIG,
      'go.mod': `module ${TOOL}\n\ngo 1.26.0\n`,
    })
    expect((await findGoConsumers(root)).map((c) => c.name)).toEqual(['app'])
  })
})

describe('goJobId', () => {
  it('names the root module go and a nested one after its path', () => {
    expect(goJobId('')).toBe('go')
    expect(goJobId('services/api.v2')).toBe('go-services-api-v2')
  })
})

describe('checkGoGateJob', () => {
  it('flags a codeality.yml without the job of the module', () => {
    const context = { codealityWorkflow: WORKFLOW, jobId: 'go' }
    expect(checkGoGateJob(context).map((f) => f.id)).toEqual([
      'go-gate-job-missing',
    ])
  })
})

describe('checkGoPin', () => {
  it('names a stale version', () => {
    const codealityWorkflow = WORKFLOW.replace('@v0.1.0', '@v0.0.9')
    const [finding] = checkGoPin({ codealityWorkflow, versions: VERSIONS })
    expect(finding.id).toBe('go-pin-outdated')
    expect(finding.message).toContain('0.0.9')
  })

  it('reports latest as not released', () => {
    const codealityWorkflow = WORKFLOW.replace('@v0.1.0', '@latest')
    expect(
      checkGoPin({ codealityWorkflow, versions: VERSIONS }).map((f) => f.id),
    ).toEqual(['go-pin-not-released'])
  })
})

describe('runGoConformance', () => {
  it('reads a wired module as clean', async () => {
    await mkdir(join(root, 'repo', '.git'), { recursive: true })
    await project('repo', { '.github/workflows/codeality.yml': WORKFLOW })
    await project('repo/services/api', { 'codeality-go.yaml': CONFIG })
    const { findings } = await runGoConformance(
      join(root, 'repo', 'services', 'api'),
      VERSIONS,
    )
    expect(findings).toEqual([])
  })
})

describe('formatGoEstate', () => {
  it('shows one column per class of wiring', () => {
    const table = formatGoEstate([
      { name: 'wired', findings: [] },
      { name: 'stale', findings: [{ id: 'go-pin-outdated' }] },
    ])
    expect(table).toContain('wired       ok     ok     ok')
    expect(table).toContain('stale       ok     ok     FAIL')
    expect(table).toContain('2 Go projects, 1 fully wired.')
  })
})
