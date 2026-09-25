import { describe, expect, it } from 'vitest'

import { runInspect } from '@/adapters/supabase/runInspect.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'

const config = { audit: { inGate: true, bloatThreshold: 5 }, disable: [] }

describe('runInspect', () => {
  it('runs index-stats and bloat against the target', () => {
    const calls: string[][] = []
    const runner: CommandRunner = (_c, args) => {
      calls.push(args)
      return { status: 0, stdout: '{"rows":[]}', stderr: '', missing: false }
    }
    expect(runInspect(runner, '/p', { linked: true }, config)).toEqual([])
    expect(calls).toEqual([
      ['inspect', 'db', 'index-stats', '--output-format', 'json', '--linked'],
      ['inspect', 'db', 'bloat', '--output-format', 'json', '--linked'],
    ])
  })
  it('names the report that failed', () => {
    const runner: CommandRunner = () => ({
      status: 1,
      stdout: '',
      stderr: 'denied',
      missing: false,
    })
    expect(() => runInspect(runner, '/p', { linked: true }, config)).toThrow(
      /supabase inspect index-stats failed: 1: denied/,
    )
  })
})
