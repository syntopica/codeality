import { describe, expect, it } from 'vitest'

import { LEGACY_DISABLE_REASON } from '@/config/LEGACY_DISABLE_REASON.js'
import { PERF_INIT_SECTION } from '@/init/PERF_INIT_SECTION.js'
import { upgradedConfigDocument } from '@/init/upgradedConfigDocument.js'

describe('upgradedConfigDocument', () => {
  it('bumps the version, objectifies disable, adds the new sections and keeps the rest', () => {
    const raw = {
      schemaVersion: 1,
      supabase: { migrations: 'm' },
      audit: { inGate: true },
      disable: ['BDB001'],
    }
    expect(
      upgradedConfigDocument(raw, { postgrest: { roots: ['src'] } }),
    ).toEqual({
      schemaVersion: 2,
      supabase: { migrations: 'm' },
      audit: { inGate: true },
      disable: [{ code: 'BDB001', reason: LEGACY_DISABLE_REASON }],
      postgrest: { roots: ['src'] },
      perf: PERF_INIT_SECTION,
    })
  })
  it('does not overwrite sections the file already has', () => {
    const raw = {
      schemaVersion: 1,
      postgrest: { roots: ['app'] },
      perf: { inGate: true },
    }
    expect(
      upgradedConfigDocument(raw, { postgrest: { roots: ['src'] } }),
    ).toMatchObject({ postgrest: { roots: ['app'] }, perf: { inGate: true } })
  })
})
