import { describe, expect, it } from 'vitest'

import { tapOcclusionFields } from '@/capture/tapOcclusionFields.js'

describe('captured tap coverage fields', () => {
  it('omits uncertain coverage before and after serialization', () => {
    const payload = { id: 1, ...tapOcclusionFields(undefined) }
    expect(Object.hasOwn(payload, 'tapOcclusion')).toBe(false)
    expect(JSON.parse(JSON.stringify(payload))).toEqual({ id: 1 })
  })
  it('preserves the confirmed rectangle as an own payload property', () => {
    const cover = { x: 0, y: 12, width: 390, height: 52 }
    const payload = { id: 1, ...tapOcclusionFields(cover) }
    expect(Object.hasOwn(payload, 'tapOcclusion')).toBe(true)
    expect(payload.tapOcclusion).toBe(cover)
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      id: 1,
      tapOcclusion: cover,
    })
  })
})
