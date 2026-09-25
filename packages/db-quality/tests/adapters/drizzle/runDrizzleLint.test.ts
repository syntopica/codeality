import { describe, expect, it } from 'vitest'

import { runDrizzleLint } from '@/adapters/drizzle/runDrizzleLint.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const drizzle = { roots: ['src', 'server'], objectNames: ['db', 'trx'] }

describe('runDrizzleLint', () => {
  it('runs eslint with the shipped config, the roots and the object names', () => {
    let seen:
      { args: string[]; env: Record<string, string> | undefined } | undefined
    const runner: CommandRunner = (_command, args, options) => {
      seen = { args, env: options.env }
      return { status: 0, stdout: '[]', stderr: '', missing: false }
    }
    expect(runDrizzleLint(runner, '/p', drizzle, [])).toEqual([])
    expect(seen?.args.slice(0, 2)).toEqual(['--no-config-lookup', '-c'])
    expect(seen?.args[2]).toMatch(/assets\/drizzle-eslint\.config\.mjs$/)
    expect(seen?.args.slice(3)).toEqual(['-f', 'json', 'src', 'server'])
    expect(seen?.env).toEqual({ CODEALITY_DB_DRIZZLE_OBJECTS: 'db,trx' })
  })
  it('raises ToolMissingError when eslint is absent', () => {
    const runner: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() => runDrizzleLint(runner, '/p', drizzle, [])).toThrow(
      ToolMissingError,
    )
  })
  it('surfaces a crash with its stderr', () => {
    const runner: CommandRunner = () => ({
      status: 2,
      stdout: '',
      stderr: 'bad config',
      missing: false,
    })
    expect(() => runDrizzleLint(runner, '/p', drizzle, [])).toThrow(
      /eslint exited 2: bad config/,
    )
  })
})
