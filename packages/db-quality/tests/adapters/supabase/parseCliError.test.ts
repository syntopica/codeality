import { describe, expect, it } from 'vitest'

import { parseCliError } from '@/adapters/supabase/parseCliError.js'

describe('parseCliError', () => {
  it('extracts the error document the CLI prints', () => {
    expect(
      parseCliError(
        'Initialising login role...\n{"_tag":"Error","error":{"code":"LegacyDbAdvisorsSecurityStatusError","message":"unexpected security advisors status 401: {\\"message\\":\\"Unauthorized\\"}"}}',
      ),
    ).toEqual({
      code: 'LegacyDbAdvisorsSecurityStatusError',
      message: expect.stringContaining('401') as string,
    })
  })
  it('stops at the document even when more output follows it', () => {
    expect(
      parseCliError(
        '{"_tag":"Error","error":{"code":"LegacyDbConnectError","message":"failed to connect: {}"}}\nTry again\n',
      ),
    ).toEqual({
      code: 'LegacyDbConnectError',
      message: 'failed to connect: {}',
    })
  })
  it('returns undefined for a normal document', () => {
    expect(parseCliError('{"results":[]}')).toBeUndefined()
  })
  it('keeps a truncated error document as unknown', () => {
    expect(parseCliError('{"_tag":"Error","error":{"code":"X"')).toEqual({
      code: 'unknown',
      message: '{"_tag":"Error","error":{"code":"X"',
    })
  })
})
