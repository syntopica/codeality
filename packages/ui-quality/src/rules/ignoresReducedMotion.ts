import type { MotionRecord } from '@/model/MotionRecord.js'
import { LONG_LOOP_MS } from '@/rules/LONG_LOOP_MS.js'
import { MOTION_PROPERTIES } from '@/rules/MOTION_PROPERTIES.js'

/** A running animation that moves something, or fades in a loop longer than a second. */
export const ignoresReducedMotion = (animation: MotionRecord): boolean =>
  animation.properties.some((property) => MOTION_PROPERTIES.has(property)) ||
  (animation.properties.includes('opacity') &&
    animation.infinite &&
    animation.duration > LONG_LOOP_MS)
