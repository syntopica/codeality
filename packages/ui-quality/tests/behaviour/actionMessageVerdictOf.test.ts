import { describe, expect, it } from 'vitest'

import type { ActionMessageCase } from '@/behaviour/ActionMessageCase.js'
import type { ActionMessageObservation } from '@/behaviour/ActionMessageObservation.js'
import { actionMessageVerdictOf } from '@/behaviour/actionMessageVerdictOf.js'

const observed = (
  lines: string[],
  over: Partial<ActionMessageObservation> = {},
): ActionMessageObservation => ({
  alerts: [],
  dialogs: [],
  lines,
  controlText: 'Save',
  before: [],
  addressChanged: false,
  busy: false,
  client: false,
  invalidField: false,
  ...over,
})

const verdict = (
  actionCase: ActionMessageCase,
  lines: string[],
  over: Partial<ActionMessageObservation> = {},
) => actionMessageVerdictOf(actionCase, observed(lines, over))

describe('actionMessageVerdictOf', () => {
  it('hang: still busy at the deadline with only a busy label (#15)', () => {
    expect(
      verdict('as-is', ['Creating...'], {
        controlText: 'Creating...',
        busy: true,
      }),
    ).toBe('hang')
    expect(verdict('fail-hang', [], { busy: true })).toBe('hang')
  })
  it('hang: passes once a message appears', () => {
    expect(
      verdict('fail-hang', ['Request timed out. Check your connection'], {
        busy: true,
      }),
    ).not.toBe('hang')
  })

  it('absent: no message, dialog or change of address (#14)', () => {
    expect(verdict('as-is', [], { client: true })).toBe('absent')
    expect(verdict('fail-500', [])).toBe('absent')
  })
  it('absent: a client refusal without a message still fails under wrong', () => {
    expect(verdict('wrong', [], { client: true })).toBe('absent')
  })

  it('redacted: framework placeholders (#1, #5)', () => {
    expect(
      verdict('as-is', [
        'Could not send invite - An error occurred in the Server Components render...',
      ]),
    ).toBe('redacted')
    expect(
      verdict('stale-action', [
        'Server Action "abc" was not found on the server.',
      ]),
    ).toBe('redacted')
    expect(
      verdict('fail-action', [
        'An unexpected response was received from the server.',
      ]),
    ).toBe('redacted')
  })

  it('raw: machine text (#7, #8)', () => {
    expect(
      verdict('wrong', ['invalid input syntax for type uuid: acc-1']),
    ).toBe('raw')
    expect(verdict('as-is', ['Blocked by marketingCollateral'])).toBe('raw')
    expect(verdict('fail-500', ['Internal Server Error'])).toBe('raw')
    expect(
      verdict('fail-action', ['audit-marker-1'], {
        injectedBody: 'audit-marker-1',
      }),
    ).toBe('raw')
  })
  it('raw: ids the page already showed, and iPhone, pass', () => {
    expect(verdict('as-is', ['Buy the new iPhone'])).toBe('pass')
    expect(
      verdict(
        'as-is',
        ['Invoice 3f2504e0-4f89-41d3-9a0c-0305e82c3301 is locked'],
        {
          before: ['Invoice 3f2504e0-4f89-41d3-9a0c-0305e82c3301'],
        },
      ),
    ).toBe('pass')
  })

  it('false-success: success only under a fail case', () => {
    expect(verdict('fail-500', ['Saved'])).toBe('false-success')
  })
  it('false-success: a success word beside a failure word passes', () => {
    expect(verdict('fail-500', ['Saved', 'Save failed - quota reached'])).toBe(
      'pass',
    )
  })

  it('generic: nothing about the cause (#3, #6, #19)', () => {
    expect(verdict('as-is', ['Database write failed.'])).toBe('generic')
    expect(
      verdict('as-is', ['Autofill failed - Fill the steps manually']),
    ).toBe('generic')
    expect(verdict('as-is', ['Something went wrong. Please try again.'])).toBe(
      'generic',
    )
  })
  it('generic: a specific cause passes', () => {
    expect(
      verdict('as-is', ['Could not send invite - You need the Admin role']),
    ).toBe('pass')
  })

  it('accepted-wrong: the server took a bad value (#12, #13)', () => {
    expect(verdict('wrong', ['Password updated'])).toBe('accepted-wrong')
    expect(verdict('missing', [], { addressChanged: true })).toBe(
      'accepted-wrong',
    )
  })
  it('accepted-wrong: client refusals and invalid fields pass', () => {
    expect(verdict('wrong', ['Enter a valid email'], { client: true })).toBe(
      'pass',
    )
    expect(
      verdict('wrong', ['Enter a valid email'], { invalidField: true }),
    ).toBe('pass')
  })

  it('coverage: an as-is client refusal with a message is not a finding', () => {
    expect(verdict('as-is', ['Enter a valid email'], { client: true })).toBe(
      'coverage',
    )
  })
})
