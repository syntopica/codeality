import { describe, expect, it } from 'vitest'

import { redactedDbUrl } from '@/adapters/kysely/drift/redactedDbUrl.js'

const URL_WITH_PASSWORD = 'postgres://app:p%40ss%2Fword@db.local:5432/app'

describe('redactedDbUrl', () => {
  it('removes the URL and its password, raw and decoded', () => {
    const text = `failed ${URL_WITH_PASSWORD}; raw p%40ss%2Fword; decoded p@ss/word`
    expect(redactedDbUrl(text, URL_WITH_PASSWORD)).toBe(
      'failed <redacted>; raw <redacted>; decoded <redacted>',
    )
  })
  it('leaves text alone for a URL without a password', () => {
    expect(redactedDbUrl('no secret here', 'postgres://app@db/app')).toBe(
      'no secret here',
    )
  })
})
