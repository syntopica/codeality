/**
 * Words that mean a test may need a window. Deliberately broad: a file that
 * matches is never proposed for node, and the node rerun is what decides for
 * the rest, so a missed word costs a failed candidate, never a broken suite.
 */
export const DOM_API_PATTERN =
  /\b(?:window|document|localStorage|sessionStorage|navigator|location|HTMLElement|Element|DOMParser|FileReader|Blob|matchMedia|requestAnimationFrame|IntersectionObserver|ResizeObserver|MutationObserver|customElements|renderHook|render|screen|fireEvent|userEvent|jsdom|happy-dom)\b|@testing-library/
