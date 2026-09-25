import { describe, expect, it } from 'vitest'

import { runAudit } from '@/audit/runAudit.js'
import { configFromDocument } from '@/config/configFromDocument.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

describe('runAudit', () => {
  it('runs advisors and inspect, and Soda only with a db url', () => {
    const commands: string[] = []
    const runner: CommandRunner = (command, args) => {
      commands.push(`${command} ${args[0] ?? ''}`)
      return {
        status: 0,
        stdout:
          command === 'supabase' && args[0] === 'db'
            ? '{"results":[]}'
            : '{"rows":[]}',
        stderr: '',
        missing: false,
      }
    }
    const config = configFromDocument({
      schemaVersion: 1,
      audit: { soda: 'db-quality/soda' },
    })
    runAudit({ root: '/p', config, runner, target: { linked: true } })
    expect(commands).toEqual([
      'supabase db',
      'supabase inspect',
      'supabase inspect',
    ])
    const url = 'postgres://u:p@db.x.supabase.co/d'
    expect(() =>
      runAudit({ root: '/p', config, runner, target: { dbUrl: url } }),
    ).toThrow(/soda scan produced no results/)
    expect(commands.at(-1)).toBe('uvx --with')
  })
})
