import type { Rgba } from '@/model/Rgba.js'

/** `#rgb` or `#rrggbb`, already validated by the configuration reader. */
export const hexToRgba = (hex: string): Rgba => {
  const digits = hex.slice(1)
  const full = digits.length === 3 ? digits.replaceAll(/./g, '$&$&') : digits
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
    1,
  ]
}
