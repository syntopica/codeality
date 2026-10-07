import { describe, expect, it } from 'vitest'

import { runKyselyLint } from '@/adapters/kysely/runKyselyLint.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

const kysely = { roots: ['src'], objectNames: ['db', 'conn'] }

describe('runKyselyLint', () => {
  it('runs eslint with the Kysely asset and maps its rules to BDB310', () => {
    let seen:
      { args: string[]; env: Record<string, string> | undefined } | undefined
    const runner: CommandRunner = (_command, args, options) => {
      seen = { args, env: options.env }
      return {
        status: 1,
        stdout: JSON.stringify([
          {
            filePath: '/p/src/repo.ts',
            messages: [
              { ruleId: 'kysely/delete-without-where', message: 'm', line: 4 },
            ],
          },
        ]),
        stderr: '',
        missing: false,
      }
    }
    const findings = runKyselyLint(runner, '/p', kysely, [])
    expect(findings.map((f) => [f.code, f.path, f.line])).toEqual([
      ['BDB310/delete-without-where', 'src/repo.ts', 4],
    ])
    expect(seen?.args[2]).toMatch(/assets\/kysely-eslint\.config\.mjs$/)
    expect(seen?.args.at(-1)).toBe('src')
    expect(seen?.env).toEqual({ CODEALITY_DB_KYSELY_OBJECTS: 'db,conn' })
  })
  it('asks for eslint and typescript-eslint when eslint is absent', () => {
    const runner: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() => runKyselyLint(runner, '/p', kysely, [])).toThrow(
      ToolMissingError,
    )
  })
})
