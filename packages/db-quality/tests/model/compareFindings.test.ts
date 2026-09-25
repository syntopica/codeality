import { describe, expect, it } from 'vitest'

import { compareFindings } from '@/model/compareFindings.js'
import type { Finding } from '@/model/Finding.js'

const make = (path: string, line: number, code: string): Finding => ({
  code,
  severity: 'warn',
  path,
  line,
  message: '',
  subject: '',
  fingerprint: '',
})

describe('compareFindings', () => {
  it('orders by path, then line, then code', () => {
    const sorted = [
      make('b.sql', 1, 'BDB001'),
      make('a.sql', 9, 'BDB002'),
      make('a.sql', 9, 'BDB001'),
      make('a.sql', 2, 'BDB005'),
    ].sort(compareFindings)
    expect(sorted.map((f) => `${f.path}:${String(f.line)}:${f.code}`)).toEqual([
      'a.sql:2:BDB005',
      'a.sql:9:BDB001',
      'a.sql:9:BDB002',
      'b.sql:1:BDB001',
    ])
  })
})
