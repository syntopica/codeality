import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { spawnRunner } from '@/tools/spawnRunner.js'

describe('spawnRunner', () => {
  it('captures stdout, stderr and the status', () => {
    const result = spawnRunner(
      'node',
      ['-e', 'console.log("out"); console.error("err"); process.exit(3)'],
      { cwd: process.cwd() },
    )
    expect(result).toEqual({
      status: 3,
      stdout: 'out\n',
      stderr: 'err\n',
      missing: false,
    })
  })
  it('reports a missing executable instead of throwing', () => {
    expect(
      spawnRunner('definitely-not-a-command-xyz', [], { cwd: process.cwd() }),
    ).toEqual({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
  })
  it('puts node_modules/.bin of the cwd first on PATH', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'dbq-'))
    const result = spawnRunner(
      'node',
      [
        '-e',
        'console.log(process.env.PATH.split(require("node:path").delimiter)[0])',
      ],
      { cwd },
    )
    expect(result.stdout.trim()).toBe(join(cwd, 'node_modules/.bin'))
  })
})
