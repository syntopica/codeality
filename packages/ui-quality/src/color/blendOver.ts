import type { Rgba } from '@/model/Rgba.js'

/** `top` painted over an opaque `bottom`, as the screen shows it. */
export const blendOver = (top: Rgba, bottom: Rgba): Rgba => {
  const alpha = top[3]
  const mix = (index: 0 | 1 | 2): number =>
    Math.round(alpha * top[index] + (1 - alpha) * bottom[index])
  return [mix(0), mix(1), mix(2), 1]
}
