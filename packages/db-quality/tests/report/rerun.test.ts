import { describe, expect, it } from 'vitest'

import { perfRerun } from '@/report/perfRerun.js'
import { targetRerunFlags } from '@/report/targetRerunFlags.js'

const perf = (code: string) => ({
  code,
  severity: 'error' as const,
  path: 'postgres',
  line: 0,
  message: 'm',
  subject: '',
  fingerprint: 'f',
})

describe('rerun commands', () => {
  it('reruns bench findings with bench and the rest with diff, never --record', () => {
    expect(perfRerun(perf('BDB911'), '')).toBe('codeality-db perf bench --json')
    expect(perfRerun(perf('BDB901'), '')).toBe('codeality-db perf diff --json')
  })
  it('names the explicit target without echoing its URL', () => {
    expect(targetRerunFlags(false)).toBe('')
    expect(targetRerunFlags(true)).toBe(' --db-url "$DB_URL"')
    expect(perfRerun(perf('BDB902'), targetRerunFlags(true))).toBe(
      'codeality-db perf diff --db-url "$DB_URL" --json',
    )
  })
})
