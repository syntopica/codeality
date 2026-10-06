import type { Rgba } from '@/model/Rgba.js'

/**
 * The background of `<html>` or `<body>`. The probe walks the elements inside
 * body, so these two are the canvas every other fill sits on.
 */
export type RootBackground = {
  color: Rgba | null
  hasImage: boolean
}
