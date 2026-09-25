import { describe, expect, it } from 'vitest'

import { psqlArguments } from '@/postgres/psqlArguments.js'
import { psqlSession } from '@/postgres/psqlSession.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const target = { url: 'postgres://u@h/d', host: 'h', password: 'pw' }

describe('psqlSession', () => {
  it('opens every statement read-only with a timeout, before the query', () => {
    expect(psqlArguments('postgres://u@h/d', 30000, ['select 1'])).toEqual([
      'postgres://u@h/d',
      '-X',
      '-q',
      '-A',
      '-t',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      'set default_transaction_read_only = on',
      '-c',
      'set statement_timeout = 30000',
      '-c',
      'select 1',
    ])
  })
  it('wraps rows in json_agg and passes the password through the environment only', () => {
    const seen: { args: string[]; env: Record<string, string> | undefined }[] =
      []
    const runner: CommandRunner = (_c, args, options) => {
      seen.push({ args, env: options.env })
      return { status: 0, stdout: '[{"a":1}]\n', stderr: '', missing: false }
    }
    expect(
      psqlSession(runner, '/p', target, 30000).rows('select 1 as a'),
    ).toEqual([{ a: 1 }])
    expect(seen[0]?.args.at(-1)).toBe(
      "select coalesce(json_agg(t), '[]'::json) from (select 1 as a) t",
    )
    expect(seen[0]?.env).toEqual({ PGPASSWORD: 'pw', PGCONNECT_TIMEOUT: '10' })
    expect(JSON.stringify(seen)).not.toContain('pw@')
  })
  it('returns an empty list for an empty result', () => {
    const runner: CommandRunner = () => ({
      status: 0,
      stdout: '\n',
      stderr: '',
      missing: false,
    })
    const session = psqlSession(runner, '/p', target, 1000)
    expect(session.rows('select 1 where false')).toEqual([])
  })
  it('explains inside a DO block, then reads the plan back in the same session', () => {
    const seen: string[][] = []
    const runner: CommandRunner = (_c, args) => {
      seen.push(args)
      return {
        status: 0,
        stdout: '[{"Plan":{}}]\n',
        stderr: '',
        missing: false,
      }
    }
    const session = psqlSession(runner, '/p', target, 1000)
    expect(session.explain('select 1; commit')).toBe('[{"Plan":{}}]')
    const args = seen[0] ?? []
    expect(args.slice(7, 11)).toEqual([
      '-c',
      'set default_transaction_read_only = on',
      '-c',
      'set statement_timeout = 1000',
    ])
    expect(args[11]).toBe('-c')
    expect(args[12]).toMatch(
      /^do \$dbq_[0-9a-f]+\$ .*select 1; commit.* end \$dbq_/s,
    )
    expect(args.slice(13)).toEqual(['-c', "select current_setting('dbq.plan')"])
  })
  it('reports a missing psql as a missing tool and a failure by its stderr', () => {
    const missing: CommandRunner = () => ({
      status: -1,
      stdout: '',
      stderr: '',
      missing: true,
    })
    expect(() =>
      psqlSession(missing, '/p', target, 1000).rows('select 1'),
    ).toThrow(/psql.*install the PostgreSQL client/)
    const failing: CommandRunner = () => ({
      status: 2,
      stdout: '',
      stderr: 'psql: error: connection refused\n',
      missing: false,
    })
    expect(() =>
      psqlSession(failing, '/p', target, 1000).rows('select 1'),
    ).toThrow(/psql failed: psql: error: connection refused/)
  })
  it('redacts a password echoed back in a failure message', () => {
    const failing: CommandRunner = () => ({
      status: 2,
      stdout: '',
      stderr: 'psql: error: could not parse "postgres://u:secret@h/d"',
      missing: false,
    })
    let message = ''
    try {
      psqlSession(failing, '/p', target, 1000).rows('select 1')
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain('postgres://u:***@h/d')
    expect(message).not.toContain('secret')
  })
})
