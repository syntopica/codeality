import { describe, expect, it } from 'vitest'

import { findingLocation } from '@/report/findingLocation.js'

const finding = {
  code: 'BDB001',
  severity: 'error' as const,
  path: 'migrations/1.sql',
  line: 4,
  message: 'm',
  subject: '',
  fingerprint: 'f',
}

describe('findingLocation', () => {
  it('points at a file and line', () => {
    expect(findingLocation(finding)).toEqual({
      path: 'migrations/1.sql',
      line: 4,
    })
  })
  it('drops line 0, which means the whole file', () => {
    expect(findingLocation({ ...finding, line: 0 })).toEqual({
      path: 'migrations/1.sql',
    })
  })
  it.each(['postgres', 'supabase'])(
    'gives no location for a %s finding, which is not a file',
    (path) => {
      expect(findingLocation({ ...finding, path, line: 0 })).toEqual({})
    },
  )
})
