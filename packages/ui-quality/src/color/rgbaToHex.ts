import type { Rgba } from '@/model/Rgba.js'

export const rgbaToHex = ([r, g, b]: Rgba): string =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
