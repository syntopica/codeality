/** Find the controlled popup only when its listbox is present in the capture. */
export const controlledListboxPopupOf = (element, visible) => {
  const listbox = '[role="listbox" i]'
  const controls =
    element.getAttribute('aria-controls') ??
    element.getAttribute('aria-owns') ??
    ''
  for (const id of controls.trim().split(/\s+/)) {
    const popup = element.ownerDocument.getElementById(id)
    if (!popup || popup === element) continue
    if (
      (popup.matches(listbox) && visible.has(popup)) ||
      [...popup.querySelectorAll(listbox)].some((box) => visible.has(box))
    )
      return popup
  }
  return null
}
