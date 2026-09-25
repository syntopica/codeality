import { describe, expect, it } from 'vitest'

import { runPrismaLint } from '@/adapters/prisma/runPrismaLint.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

describe('runPrismaLint', () => {
  it('runs prisma-lint with the shipped config and reads stderr', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (command, args) => {
      calls.push([command, ...args])
      return {
        status: 1,
        stdout: '',
        stderr: '{"violations":[]}',
        missing: false,
      }
    }
    expect(runPrismaLint(runner, '/p', 'prisma/schema.prisma', [])).toEqual([])
    expect(calls[0]?.slice(0, 2)).toEqual(['prisma-lint', '-c'])
    expect(calls[0]?.[2]).toMatch(/assets\/prisma-lint\.json$/)
    expect(calls[0]?.slice(3)).toEqual(['-o', 'json', 'prisma/schema.prisma'])
  })
  it('raises ToolMissingError when absent', () => {
    expect(() =>
      runPrismaLint(
        () => ({ status: -1, stdout: '', stderr: '', missing: true }),
        '/p',
        'x',
        [],
      ),
    ).toThrow(ToolMissingError)
  })
  it('surfaces a crash with its stderr', () => {
    expect(() =>
      runPrismaLint(
        () => ({ status: 2, stdout: '', stderr: 'boom', missing: false }),
        '/p',
        'x',
        [],
      ),
    ).toThrow(/prisma-lint exited 2: boom/)
  })
})
