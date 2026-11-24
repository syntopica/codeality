/** An enabled text-entry control that can accept a dropdown search query. */
export const isEditableSearch = (element) => {
  if (
    element.matches(':disabled, [readonly]') ||
    element.closest('[inert], [aria-hidden="true"], [aria-disabled="true"]') ||
    element.getAttribute('aria-readonly') === 'true'
  )
    return false
  if (element instanceof HTMLInputElement)
    return ['text', 'search', 'email', 'tel', 'url'].includes(element.type)
  return element instanceof HTMLTextAreaElement || element.isContentEditable
}
