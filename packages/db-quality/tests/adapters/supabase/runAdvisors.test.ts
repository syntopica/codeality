import { describe, expect, it } from 'vitest'

import { runAdvisors } from '@/adapters/supabase/runAdvisors.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

describe('runAdvisors', () => {
  it('passes --linked or --db-url', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (_c, args) => {
      calls.push(args)
      return {
        status: 0,
        stdout: 'Connecting...\n{"results":[]}',
        stderr: '',
        missing: false,
      }
    }
    expect(runAdvisors(runner, '/p', { linked: true }, [])).toEqual([])
    runAdvisors(runner, '/p', { dbUrl: 'postgres://u:p@h/d' }, [])
    expect(calls[0]).toEqual([
      'db',
      'advisors',
      '--type',
      'all',
      '--output-format',
      'json',
      '--linked',
    ])
    expect(calls[1]?.slice(-2)).toEqual(['--db-url', 'postgres://u:p@h/d'])
  })
  it('turns an auth failure into an error naming the account problem', () => {
    const runner: CommandRunner = () => ({
      status: 1,
      stdout: '{"_tag":"Error","error":{"code":"X","message":"status 403"}}',
      stderr: '',
      missing: false,
    })
    expect(() => runAdvisors(runner, '/p', { linked: true }, [])).toThrow(
      /supabase advisors failed: X: status 403/,
    )
  })
  it('reports a plain non-zero exit with its stderr', () => {
    const runner: CommandRunner = () => ({
      status: 1,
      stdout: '',
      stderr: 'no link',
      missing: false,
    })
    expect(() => runAdvisors(runner, '/p', { linked: true }, [])).toThrow(
      /supabase advisors failed: 1: no link/,
    )
  })
  it('raises ToolMissingError when the CLI is absent', () => {
    expect(() =>
      runAdvisors(
        () => ({ status: -1, stdout: '', stderr: '', missing: true }),
        '/p',
        { linked: true },
        [],
      ),
    ).toThrow(ToolMissingError)
  })
})
