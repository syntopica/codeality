import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

describe('repeated --routes', () => {
  it.each([
    ['--routes', '/one', '--routes', '/two'],
    ['--routes=/one', '--routes=/two'],
    ['--routes', '/one', '--routes=/two'],
    ['--routes=/one', '--routes', '/two'],
  ])('rejects %j before configuration or artifact access', async (...argv) => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-repeated-routes-'))
    roots.push(root)
    const artifacts = join(root, '.codeality-ui')
    mkdirSync(join(artifacts, 'screens'), { recursive: true })
    const report = join(artifacts, 'report.json')
    const screen = join(artifacts, 'screens', 'old.png')
    writeFileSync(report, 'previous report')
    writeFileSync(screen, 'previous screenshot')
    const out: string[] = []
    const err: string[] = []
    const code = await runCli(['check', ...argv], {
      root,
      stdout: (text) => out.push(text),
      stderr: (text) => err.push(text),
    })
    expect(code).toBe(2)
    expect(err.join('')).toContain('--routes may only be specified once')
    expect(err.join('')).not.toContain('report:')
    expect(out).toEqual([])
    expect(readFileSync(report, 'utf8')).toBe('previous report')
    expect(readFileSync(screen, 'utf8')).toBe('previous screenshot')
  })
})
