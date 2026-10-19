import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { findSwiftConsumers } from '../bin/estate/findSwiftConsumers.mjs'
import { formatSwiftEstate } from '../bin/estate/formatSwiftEstate.mjs'
import { checkSwiftGateJob } from '../bin/swift/checkSwiftGateJob.mjs'
import { checkSwiftPin } from '../bin/swift/checkSwiftPin.mjs'
import { runSwiftConformance } from '../bin/swift/runSwiftConformance.mjs'

const VERSIONS = { 'codeality-swift': '0.1.0' }
const CONFIG = 'schema-version: 1\nroots: [Sources]\n'
const WORKFLOW = `name: codeality
on:
  workflow_call:
jobs:
  swift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          repository: syntopica/codeality
          ref: codeality-swift-v0.1.0
          path: .codeality-swift
`

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'codeality-swift-estate-'))
})

const project = async (path, files) => {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(join(root, path, name, '..'), { recursive: true })
    await writeFile(join(root, path, name), text)
  }
}

describe('findSwiftConsumers', () => {
  it('finds configured projects and skips the tool itself', async () => {
    await project('app', { 'codeality-swift.yaml': CONFIG })
    await project('baseline/packages/codeality-swift', {
      'codeality-swift.yaml': CONFIG,
      'Package.swift':
        'let package = Package(\n    name: "codeality-swift",\n)\n',
    })
    expect((await findSwiftConsumers(root)).map((c) => c.name)).toEqual(['app'])
  })
})

describe('checkSwiftGateJob', () => {
  it('flags a codeality.yml without the swift job', () => {
    const codealityWorkflow = WORKFLOW.replace('  swift:', '  dart:')
    expect(checkSwiftGateJob({ codealityWorkflow }).map((f) => f.id)).toEqual([
      'swift-gate-job-missing',
    ])
  })
})

describe('checkSwiftPin', () => {
  it('names a stale tag', () => {
    const codealityWorkflow = WORKFLOW.replace('v0.1.0', 'v0.0.9')
    const [finding] = checkSwiftPin({ codealityWorkflow, versions: VERSIONS })
    expect(finding.id).toBe('swift-pin-outdated')
    expect(finding.message).toContain('0.0.9')
  })

  it('reports a branch ref as not released', () => {
    const codealityWorkflow = WORKFLOW.replace('codeality-swift-v0.1.0', 'main')
    expect(
      checkSwiftPin({ codealityWorkflow, versions: VERSIONS }).map((f) => f.id),
    ).toEqual(['swift-pin-not-released'])
  })
})

describe('runSwiftConformance', () => {
  it('reads a wired project as clean', async () => {
    await mkdir(join(root, 'repo', '.git'), { recursive: true })
    await project('repo', {
      '.github/workflows/codeality.yml': WORKFLOW,
      'codeality-swift.yaml': CONFIG,
    })
    const { findings } = await runSwiftConformance(join(root, 'repo'), VERSIONS)
    expect(findings).toEqual([])
  })
})

describe('formatSwiftEstate', () => {
  it('shows one column per class of wiring', () => {
    const table = formatSwiftEstate([
      { name: 'wired', findings: [] },
      { name: 'stale', findings: [{ id: 'swift-pin-outdated' }] },
    ])
    expect(table).toContain('wired       ok     ok     ok')
    expect(table).toContain('stale       ok     ok     FAIL')
    expect(table).toContain('2 Swift projects, 1 fully wired.')
  })
})
