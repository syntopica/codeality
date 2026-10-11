import { MAX_INTERACTION_SHIFT } from '@/behaviour/MAX_INTERACTION_SHIFT.js'
import type { BehaviourFailure } from '@/model/BehaviourFailure.js'

/**
 * Judges the heights of the bar around a toggle group, read once per option
 * pressed. A bar that grows or shrinks moves everything below it each time
 * the user switches view.
 */
export const interactionShiftFailureOf = (
  subject: string,
  heights: number[],
): BehaviourFailure | null => {
  if (heights.length < 2) return null
  const low = Math.min(...heights)
  const high = Math.max(...heights)
  if (high - low <= MAX_INTERACTION_SHIFT) return null
  return {
    rule: 'interaction-shift',
    subject,
    message: `pressing its options resizes the bar around it from ${String(Math.round(low))}px to ${String(Math.round(high))}px, moving everything below; keep the bar one height (reserve the space, or overlay what appears)`,
  }
}
