import type { ElementBox } from '@/model/ElementBox.js'
import type { TapRect } from '@/model/TapRect.js'

/** Remove only confirmed sticky coverage, retaining every exposed fragment. */
export const visibleTapRects = (target: ElementBox): TapRect[] => {
  const cover = target.tapOcclusion
  if (
    !cover ||
    ![cover.x, cover.y, cover.width, cover.height].every(Number.isFinite) ||
    cover.width <= 0 ||
    cover.height <= 0
  )
    return [target]
  const left = Math.max(target.x, cover.x)
  const top = Math.max(target.y, cover.y)
  const right = Math.min(target.x + target.width, cover.x + cover.width)
  const bottom = Math.min(target.y + target.height, cover.y + cover.height)
  if (right <= left || bottom <= top) return [target]
  const fragments = [
    { x: target.x, y: target.y, width: target.width, height: top - target.y },
    {
      x: target.x,
      y: bottom,
      width: target.width,
      height: target.y + target.height - bottom,
    },
    { x: target.x, y: top, width: left - target.x, height: bottom - top },
    {
      x: right,
      y: top,
      width: target.x + target.width - right,
      height: bottom - top,
    },
  ]
  const visible: TapRect[] = []
  for (const rect of fragments) {
    if (rect.width > 0 && rect.height > 0) visible.push(rect)
  }
  return visible
}
