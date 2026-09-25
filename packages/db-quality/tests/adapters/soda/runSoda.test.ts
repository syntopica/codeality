import { readFileSync, writeFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { runSoda } from '@/adapters/soda/runSoda.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const soda = { dir: 'db-quality/soda', url: 'postgres://u:p@h:5432/d' }

describe('runSoda', () => {
  it('writes the configuration, runs uvx with the shim, reads the results file', () => {
    let seen: string[] = []
    let env: Record<string, string> | undefined
    const runner: CommandRunner = (command, args, options) => {
      seen = [command, ...args]
      env = options.env
      const results = args[args.indexOf('-srf') + 1] as string
      writeFileSync(
        results,
        '{"checks":[{"name":"row_count > 0","outcome":"fail","table":"t"}]}',
      )
      expect(
        readFileSync(args[args.indexOf('-c') + 1] as string, 'utf8'),
      ).toContain('type: postgres')
      return { status: 2, stdout: '', stderr: '', missing: false }
    }
    const findings = runSoda(runner, '/p', soda, [])
    expect(findings.map((f) => f.code)).toEqual(['BDB700/row_count > 0'])
    expect(seen.slice(0, 6)).toEqual([
      'uvx',
      '--with',
      'setuptools',
      '--from',
      'soda-core-postgres',
      'soda',
    ])
    expect(seen.at(-1)).toBe('db-quality/soda/checks.yml')
    expect(env).toEqual({ SETUPTOOLS_USE_DISTUTILS: 'local' })
  })
  it('fails when no results file appears, and when uvx is absent', () => {
    const crashed: CommandRunner = () => ({
      status: 3,
      stdout: '',
      stderr: 'Traceback',
      missing: false,
    })
    expect(() => runSoda(crashed, '/p', soda, [])).toThrow(
      /no results \(exit 3\): Traceback/,
    )
    const absent: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() => runSoda(absent, '/p', soda, [])).toThrow(ToolMissingError)
  })
})
