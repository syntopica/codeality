import { ordinaryPaint } from './ordinaryPaint.js'
import { ordinaryStack } from './ordinaryStack.js'

export const stickyTapCover = (element, rect) => {
  // Native buttons cannot host a closed shadow root. SVG-only descendants
  // keep hidden shadow content outside this deliberately narrow proof.
  if (element.tagName !== 'BUTTON') return undefined
  for (const child of element.querySelectorAll('*')) {
    if (child.namespaceURI !== 'http://www.w3.org/2000/svg') return undefined
  }
  const body = element.closest('tbody')
  const table = body?.parentElement
  if (table?.tagName !== 'TABLE') return undefined
  const header = table.querySelector(':scope > thead')
  if (!header || header.getClientRects().length !== 1) return undefined
  const cover = header.getBoundingClientRect()
  if (
    Math.min(rect.right, cover.right) <= Math.max(rect.left, cover.left) ||
    Math.min(rect.bottom, cover.bottom) <= Math.max(rect.top, cover.top)
  )
    return undefined
  const style = getComputedStyle(header)
  if (
    style.visibility !== 'visible' ||
    style.position !== 'sticky' ||
    !/^\d+$/.test(style.zIndex) ||
    Number(style.zIndex) <= 0 ||
    style.pointerEvents === 'none' ||
    !ordinaryPaint(header) ||
    !/^rgb\(\d+, \d+, \d+\)$/.test(style.backgroundColor) ||
    style.backgroundClip !== 'border-box'
  )
    return undefined
  for (const corner of ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']) {
    if (style[`border${corner}Radius`] !== '0px') return undefined
  }
  let left = Math.max(0, cover.left)
  let top = Math.max(0, cover.top)
  let right = Math.min(window.innerWidth, cover.right)
  let bottom = Math.min(window.innerHeight, cover.bottom)
  for (let parent = table; parent; parent = parent.parentElement) {
    if (!ordinaryStack(parent)) return undefined
    const parentStyle = getComputedStyle(parent)
    const box = parent.getBoundingClientRect()
    if (parentStyle.overflowX !== 'visible') {
      left = Math.max(left, box.left + parent.clientLeft)
      right = Math.min(right, box.left + parent.clientLeft + parent.clientWidth)
    }
    if (parentStyle.overflowY !== 'visible') {
      top = Math.max(top, box.top + parent.clientTop)
      bottom = Math.min(
        bottom,
        box.top + parent.clientTop + parent.clientHeight,
      )
    }
  }
  const overlapLeft = Math.max(left, rect.left)
  const overlapTop = Math.max(top, rect.top)
  const overlapRight = Math.min(right, rect.right)
  const overlapBottom = Math.min(bottom, rect.bottom)
  if (overlapRight <= overlapLeft || overlapBottom <= overlapTop)
    return undefined
  for (let parent = element; parent !== table; parent = parent.parentElement) {
    if (!parent || !ordinaryStack(parent)) return undefined
  }
  for (const child of element.querySelectorAll('*')) {
    if (!ordinaryStack(child)) return undefined
  }
  const hit = document.elementFromPoint(
    (overlapLeft + overlapRight) / 2,
    (overlapTop + overlapBottom) / 2,
  )
  if (!hit || !header.contains(hit)) return undefined
  return {
    x: left + window.scrollX,
    y: top + window.scrollY,
    width: right - left,
    height: bottom - top,
  }
}
