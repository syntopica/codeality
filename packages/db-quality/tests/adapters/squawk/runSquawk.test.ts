import { describe, expect, it } from 'vitest'

import { runSquawk } from '@/adapters/squawk/runSquawk.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const set = [{ path: 'supabase/migrations/1.sql', statements: [] }]

describe('runSquawk', () => {
  it('passes the Supabase excludes and every file', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (command, args) => {
      calls.push([command, ...args])
      return { status: 0, stdout: '[]', stderr: '', missing: false }
    }
    expect(runSquawk(runner, '/p', set, [])).toEqual([])
    expect(calls[0]).toEqual([
      'squawk',
      '--reporter',
      'json',
      '--exclude',
      'prefer-robust-stmts,require-lock-timeout,require-statement-timeout,require-concurrent-index-creation',
      'supabase/migrations/1.sql',
    ])
  })
  it('raises ToolMissingError when squawk is absent', () => {
    const runner: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() => runSquawk(runner, '/p', set, [])).toThrow(ToolMissingError)
  })
  it('surfaces a crash with its stderr', () => {
    const runner: CommandRunner = () => ({
      status: 101,
      stdout: '',
      stderr: 'panic',
      missing: false,
    })
    expect(() => runSquawk(runner, '/p', set, [])).toThrow(
      /squawk exited 101: panic/,
    )
  })
})
