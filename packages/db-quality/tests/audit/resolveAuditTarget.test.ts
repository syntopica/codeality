import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveAuditTarget } from '@/audit/resolveAuditTarget.js'
import { ConfigError } from '@/config/ConfigError.js'

describe('resolveAuditTarget', () => {
  it('prefers --db-url, accepts --linked only when the project is linked', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(
      resolveAuditTarget(root, { 'db-url': 'postgres://x', linked: true }),
    ).toEqual({
      dbUrl: 'postgres://x',
    })
    expect(() => resolveAuditTarget(root, { linked: true })).toThrow(
      /not linked/,
    )
    mkdirSync(join(root, 'supabase/.temp'), { recursive: true })
    writeFileSync(join(root, 'supabase/.temp/project-ref'), 'abc')
    expect(resolveAuditTarget(root, { linked: true })).toEqual({ linked: true })
    expect(() => resolveAuditTarget(root, {})).toThrow(ConfigError)
  })
})
