import type { ElementBox } from '@/model/ElementBox.js'

/** A configured clamp hides laid-out lines beyond a clipped vertical box. */
export const isLineClamped = (element: ElementBox): boolean => {
  const clamp = element.lineClamp ?? 0
  return (
    clamp > 0 &&
    element.lines > clamp &&
    element.scrollHeight > element.clientHeight + 1 &&
    ['hidden', 'clip'].includes(element.overflowY)
  )
}
