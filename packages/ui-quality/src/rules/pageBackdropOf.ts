import { blendOver } from '@/color/blendOver.js'
import type { Rgba } from '@/model/Rgba.js'
import type { RootBackground } from '@/model/RootBackground.js'
import { isPainted } from '@/rules/isPainted.js'
import { WHITE } from '@/rules/WHITE.js'

/**
 * The canvas behind every element: the `<html>` and `<body>` fills, outermost
 * first, composited over the browser's white. A dark theme that paints its
 * page colour on body read as white turned 5.9:1 header icons into 1.52:1.
 */
export const pageBackdropOf = (roots: RootBackground[]): Rgba =>
  roots.reduce<Rgba>(
    (below, root) =>
      isPainted(root.color) ? blendOver(root.color, below) : below,
    WHITE,
  )
