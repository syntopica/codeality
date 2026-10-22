import { ordinaryPaint } from './ordinaryPaint.js'

export const ordinaryStack = (element) => {
  const style = getComputedStyle(element)
  return (
    ordinaryPaint(element) &&
    style.zIndex === 'auto' &&
    ['static', 'relative'].includes(style.position)
  )
}
