import { controlledListboxPopupOf } from './controlledListboxPopupOf.js'
import { isEditableSearch } from './isEditableSearch.js'

/** Judge a custom picker only when its open listbox can be observed. */
export const isSelectOnlyPopup = (element, visible) => {
  if (element instanceof HTMLSelectElement) return false
  if (element.getAttribute('aria-expanded') !== 'true') return false
  const hasPopup = element.getAttribute('aria-haspopup')?.trim().toLowerCase()
  if (hasPopup && hasPopup !== 'listbox') return false
  if (
    !element.matches('[role="combobox" i], [aria-haspopup="listbox" i]') ||
    isEditableSearch(element)
  )
    return false

  const popup = controlledListboxPopupOf(element, visible)
  if (!popup) return false
  return ![
    ...(popup.matches('input, textarea, [contenteditable]') ? [popup] : []),
    ...popup.querySelectorAll('input, textarea, [contenteditable]'),
  ].some((field) => visible.has(field) && isEditableSearch(field))
}
