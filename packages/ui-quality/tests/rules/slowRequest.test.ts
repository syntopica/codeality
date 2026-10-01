import { describe, expect, it } from 'vitest'

import { slowRequest } from '@/rules/slowRequest.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

describe('slowRequest', () => {
  it('reports a data request slower than the threshold, naming the server action', () => {
    const findings = slowRequest(
      snapshotOf([], {
        requests: [
          {
            method: 'POST',
            path: '/app?view=reports',
            action: '7f3a9c21b4e8d0aa',
            durationMs: 2480,
          },
          { method: 'GET', path: '/api/me', action: null, durationMs: 120 },
        ],
      }),
      ruleContext(),
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]?.subject).toBe(
      'POST /app?view=reports (server action 7f3a9c21b4e8)',
    )
    expect(findings[0]?.message).toContain('took 2480ms')
  })
  it('accepts requests within the threshold', () => {
    expect(
      slowRequest(
        snapshotOf([], {
          requests: [
            { method: 'GET', path: '/', action: null, durationMs: 1000 },
          ],
        }),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('drops a GET that answered within the threshold when timed again', () => {
    expect(
      slowRequest(
        snapshotOf([], {
          requests: [
            {
              method: 'GET',
              path: '/api/fiscal/trays',
              action: null,
              durationMs: 3177,
              retimedMs: 62,
            },
          ],
        }),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('reports a GET that is still slow when timed again, with both timings', () => {
    const findings = slowRequest(
      snapshotOf([], {
        requests: [
          {
            method: 'GET',
            path: '/api/reports',
            action: null,
            durationMs: 2600,
            retimedMs: 2400,
          },
        ],
      }),
      ruleContext(),
    )
    expect(findings[0]?.message).toContain('took 2600ms')
    expect(findings[0]?.message).toContain('2400ms again')
  })
})
