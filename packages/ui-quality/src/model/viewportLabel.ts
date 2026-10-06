import type { Viewport } from '@/model/Viewport.js'

/** `1440x900`, or `390x844 phone` for an emulated phone. */
export const viewportLabel = (viewport: Viewport): string =>
  `${String(viewport.width)}x${String(viewport.height)}${viewport.mobile ? ' phone' : ''}`
