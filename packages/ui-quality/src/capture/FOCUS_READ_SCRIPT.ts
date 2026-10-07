/**
 * Runs in the page after each Tab: null when focus is on something the probe
 * did not record, else whether the focused element, or a box around it,
 * looks different from before. Running transitions are finished first, so a
 * ring that eases in is read at its end.
 */
export const FOCUS_READ_SCRIPT = `(() => {
  const element = document.activeElement
  const rest = window.__uiqFocusRest && window.__uiqFocusRest.get(element)
  if (rest === undefined) return null
  getComputedStyle(element).outlineStyle
  for (const animation of document.getAnimations()) {
    if (!(animation instanceof CSSTransition)) continue
    try { animation.finish() } catch (error) { void error }
  }
  return { element: window.__uiqIds.get(element), changed: window.__uiqFocusLook(element) !== rest }
})()`
