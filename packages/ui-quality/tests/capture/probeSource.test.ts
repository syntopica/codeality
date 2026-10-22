import { createContext, Script } from 'node:vm'

import { describe, expect, it } from 'vitest'

import { PROBE_BUNDLE_NAME } from '@/capture/PROBE_BUNDLE_NAME.js'
import { probeSource } from '@/capture/probeSource.js'

describe('composed browser probe expression', () => {
  it('creates a synchronous function without DOM or Node module globals', () => {
    const source = probeSource()
    expect(typeof source).toBe('string')
    const context = createContext({})
    const probe: unknown = new Script(`(${source})`).runInContext(context, {
      timeout: 1000,
    })
    expect(typeof probe).toBe('function')
    expect(
      new Script(`(${source}).constructor.name`).runInContext(context, {
        timeout: 1000,
      }),
    ).toBe('Function')
    expect(
      new Script(`(${source}).length`).runInContext(context, {
        timeout: 1000,
      }),
    ).toBe(1)
    expect(Object.getOwnPropertyNames(context)).toEqual([])
  })

  it('repeats safely and preserves existing page-global names', () => {
    const sentinel = { preserved: true }
    const scope = {
      [PROBE_BUNDLE_NAME]: sentinel,
      window: { [PROBE_BUNDLE_NAME]: sentinel },
    }
    const keys = Object.getOwnPropertyNames(scope)
    const context = createContext(scope)
    const expression = new Script(`(${probeSource()})`)
    const first: unknown = expression.runInContext(context, { timeout: 1000 })
    const second: unknown = expression.runInContext(context, { timeout: 1000 })
    expect(typeof first).toBe('function')
    expect(typeof second).toBe('function')
    expect(first).not.toBe(second)
    expect(scope[PROBE_BUNDLE_NAME]).toBe(sentinel)
    expect(scope.window[PROBE_BUNDLE_NAME]).toBe(sentinel)
    expect(Object.getOwnPropertyNames(scope)).toEqual(keys)
  })
})
