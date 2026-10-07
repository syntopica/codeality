import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { enableFrom } from '@/config/enableFrom.js'

const OPT_IN = 'label-punctuation'

describe('enable', () => {
  it('names the opt-in rules a project switches on, and defaults to none', () => {
    expect(enableFrom([OPT_IN])).toEqual([OPT_IN])
    expect(enableFrom(undefined)).toEqual([])
    expect(
      configFromDocument({
        baseUrl: 'x',
        routes: ['/'],
        enable: [OPT_IN],
      }).enable,
    ).toEqual([OPT_IN])
  })
  it('refuses a rule that is not opt-in and a value that is not a list of strings', () => {
    expect(() => enableFrom(['focus-invisible'])).toThrow('not an opt-in rule')
    expect(() => enableFrom(OPT_IN)).toThrow('list of strings')
  })
})
