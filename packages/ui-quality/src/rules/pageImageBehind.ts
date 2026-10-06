import type { RootBackground } from '@/model/RootBackground.js'

/**
 * Whether a gradient or image on `<body>` or `<html>` shows through, reading
 * inwards-out: an opaque body colour hides an image on html.
 */
export const pageImageBehind = (roots: RootBackground[]): boolean => {
  for (const root of roots.toReversed()) {
    if (root.hasImage) return true
    if (root.color && root.color[3] >= 1) return false
  }
  return false
}
