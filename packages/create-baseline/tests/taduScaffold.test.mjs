import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { checkActionPins } from '../bin/conformance/checkActionPins.mjs'
import { checkCiWorkflow } from '../bin/conformance/checkCiWorkflow.mjs'
import { checkGateCoverage } from '../bin/conformance/checkGateCoverage.mjs'
import { ciEntrypoints } from '../bin/conformance/ciEntrypoints.mjs'
import { ciWorkflow } from '../bin/scaffold/ciWorkflow.mjs'
import { hasTaduBacklog } from '../bin/scaffold/hasTaduBacklog.mjs'
import { lefthookConfig } from '../bin/scaffold/lefthookConfig.mjs'

const SCRIPTS = {
  'check:ci': 'x',
  'check:quality': 'x',
  'check:security': 'x',
  build: 'x',
}

let root
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'tadu-scaffold-'))
})
afterEach(async () => {
  await rm(root, { recursive: true, force: true })
  await rm(`${root}.out`, { force: true })
})

describe('hasTaduBacklog', () => {
  it('is false for a repository without a backlog', async () => {
    expect(await hasTaduBacklog(root)).toBe(false)
  })

  it('detects a format 2 backlog', async () => {
    await mkdir(join(root, 'todo'))
    await writeFile(join(root, 'todo', 'tadu.json'), '{}')
    expect(await hasTaduBacklog(root)).toBe(true)
  })

  it('detects a format 1 backlog', async () => {
    await writeFile(join(root, 'TODO.md'), '')
    expect(await hasTaduBacklog(root)).toBe(true)
  })
})

describe('ciWorkflow with tadu', () => {
  const yml = ciWorkflow({ hasBuild: true, tadu: true })

  it('adds the classify and backlog jobs', () => {
    expect(yml).toContain('  changes:\n')
    expect(yml).toContain('  backlog:\n')
    expect(yml).toContain('tadu==0.2.0 tadu doctor .')
  })

  it('conditions every gate job on a code change', () => {
    for (const job of ['verify', 'quality', 'security', 'build']) {
      const block = yml.split(`\n  ${job}:\n`)[1].split('\n    steps:')[0]
      expect(block, job).toContain('changes')
      expect(block, job).toContain("if: needs.changes.outputs.code == 'true'")
    }
    expect(yml).toContain('needs: [changes, verify]')
  })

  it('is unchanged without tadu', () => {
    expect(ciWorkflow({ hasBuild: true })).not.toContain('changes')
    expect(ciWorkflow({ hasBuild: true, tadu: false })).toBe(
      ciWorkflow({ hasBuild: true }),
    )
  })

  it('still satisfies the conformance checks', () => {
    const workflows = [{ name: 'ci.yml', text: yml }]
    expect(checkCiWorkflow({ workflows })).toEqual([])
    expect(checkActionPins({ workflows })).toEqual([])
    expect(ciEntrypoints(workflows, SCRIPTS)).toEqual(
      expect.arrayContaining(['check:ci', 'check:quality', 'check:security']),
    )
    const plain = [{ name: 'ci.yml', text: ciWorkflow({ hasBuild: true }) }]
    expect(checkGateCoverage({ workflows, scripts: SCRIPTS })).toEqual(
      checkGateCoverage({ workflows: plain, scripts: SCRIPTS }),
    )
  })
})

describe('classify script', () => {
  const script = ciWorkflow({ tadu: true })
    .split('id: classify')[1]
    .split('run: |\n')[1]
    .split('\n\n')[0]
    .split('\n')
    .map((line) => line.slice(10))
    .join('\n')

  const git = (...args) =>
    execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()

  const classify = async (touch, base) => {
    const out = `${root}.out`
    await writeFile(out, '')
    for (const file of touch) {
      await mkdir(join(root, file, '..'), { recursive: true })
      await writeFile(join(root, file), `${Math.random()}`)
    }
    git('add', '-A')
    git('commit', '-qm', 'change')
    execFileSync('bash', ['-c', script], {
      cwd: root,
      env: {
        ...process.env,
        BASE: base ?? git('rev-parse', 'HEAD~1'),
        GITHUB_OUTPUT: out,
      },
    })
    return execFileSync('cat', [out], { encoding: 'utf8' }).trim().split('\n')
  }

  beforeEach(async () => {
    git('init', '-q')
    git('config', 'user.email', 't@example.com')
    git('config', 'user.name', 't')
    await mkdir(join(root, 'todo', 'open'), { recursive: true })
    await writeFile(join(root, 'todo', 'open', 'a.json'), '{}')
    await writeFile(join(root, 'a.ts'), '')
    git('add', '-A')
    git('commit', '-qm', 'init')
  })

  it('skips the gates for a backlog-only change', async () => {
    expect(await classify(['todo/open/a.json'])).toEqual([
      'code=false',
      'backlog=true',
    ])
  })

  it('runs everything for a mixed change', async () => {
    expect(await classify(['todo/open/a.json', 'a.ts'])).toEqual([
      'code=true',
      'backlog=true',
    ])
  })

  it('runs only the gates for a code-only change', async () => {
    expect(await classify(['a.ts'])).toEqual(['code=true', 'backlog=false'])
  })

  it('runs everything without a usable base', async () => {
    expect(await classify(['todo/open/a.json'], '0'.repeat(40))).toEqual([
      'code=true',
      'backlog=true',
    ])
  })
})

describe('lefthookConfig with tadu', () => {
  it('is unchanged without tadu', () => {
    expect(lefthookConfig()).not.toContain('tadu')
    expect(lefthookConfig({ tadu: false })).toBe(lefthookConfig())
  })

  it('excludes the backlog from file checks and validates it', () => {
    const yml = lefthookConfig({ tadu: true })
    expect(yml.match(/exclude:\n {8}- todo\/\*\*/g)).toHaveLength(3)
    expect(yml).toContain('backlog:')
    expect(yml).toContain("- run: '! command -v tadu'")
    expect(yml).toContain('run: tadu doctor .')
  })
})
