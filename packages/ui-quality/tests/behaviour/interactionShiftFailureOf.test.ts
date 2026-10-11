import { describe, expect, it } from 'vitest'

import { interactionShiftFailureOf } from '@/behaviour/interactionShiftFailureOf.js'

describe('interactionShiftFailureOf', () => {
  it('names a bar that changes height between options', () => {
    expect(
      interactionShiftFailureOf('toggle group "View"', [204, 254, 204]),
    ).toEqual({
      rule: 'interaction-shift',
      subject: 'toggle group "View"',
      message:
        'pressing its options resizes the bar around it from 204px to 254px, moving everything below; keep the bar one height (reserve the space, or overlay what appears)',
    })
  })
  it('accepts a few pixels of drift and a group that could not be read', () => {
    expect(interactionShiftFailureOf('g', [204, 208])).toBeNull()
    expect(interactionShiftFailureOf('g', [204])).toBeNull()
    expect(interactionShiftFailureOf('g', [])).toBeNull()
  })
})
