import type { Viewport } from '@/model/Viewport.js'

// A wide desktop, a laptop and a phone: wasted width shows at the first,
// cramping at the last.
export const DEFAULT_VIEWPORTS: Viewport[] = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]
