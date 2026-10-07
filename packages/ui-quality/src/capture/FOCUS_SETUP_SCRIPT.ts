/**
 * Runs in the page before the Tab pass: records, for every focusable element
 * the probe walked, the look of the element and of the boxes a focus ring may
 * be painted on instead (three ancestors for `:focus-within`, the siblings for
 * a custom checkbox). A string, because this package compiles without the DOM
 * library.
 */
export const FOCUS_SETUP_SCRIPT = `(() => {
  const ids = window.__uiqIds
  if (!ids) return 0
  const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]'
  const look = (element) => {
    const s = getComputedStyle(element)
    return [
      s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow,
      s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor,
      s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth,
      s.backgroundColor, s.backgroundImage, s.color, s.textDecorationLine,
    ].join('|')
  }
  const around = (element) => {
    const parent = element.parentElement
    const grand = parent && parent.parentElement
    const great = grand && grand.parentElement
    return [element, parent, grand, great, element.previousElementSibling, element.nextElementSibling]
      .map((node) => (node ? look(node) : ''))
      .join('||')
  }
  window.__uiqFocusLook = around
  const rest = new Map()
  for (const element of ids.keys()) {
    if (!element.matches(FOCUSABLE) || element.matches(':disabled')) continue
    if (element.tabIndex < 0 || (element.tagName === 'INPUT' && element.type === 'hidden')) continue
    rest.set(element, around(element))
  }
  window.__uiqFocusRest = rest
  if (document.activeElement) document.activeElement.blur()
  return rest.size
})()`
