import type { Lab } from '@/color/Lab.js'

/** CIE76 distance: about 2.3 is a just-noticeable difference. */
export const deltaE = (a: Lab, b: Lab): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
