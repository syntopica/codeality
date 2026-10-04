/**
 * Words that mean a test may need a window. Deliberately broad: a file that
 * matches is never proposed for node, and the node rerun is what decides for
 * the rest, so a missed word costs a failed candidate, never a broken suite.
 * `document` and `location` count only as globals read through a property
 * (`document.body`): bare, they are an HTTP header or a noun in a test name,
 * which kept 11 of 70 node-safe 10xjoy files off the list (2026-10-04).
 * `Blob` is left out because node has it.
 */
export const DOM_API_PATTERN =
  /(?<![\w.'"])(?:document|location)\.|\b(?:window|localStorage|sessionStorage|navigator|HTMLElement|Element|DOMParser|FileReader|matchMedia|requestAnimationFrame|IntersectionObserver|ResizeObserver|MutationObserver|customElements|renderHook|render|screen|fireEvent|userEvent|jsdom|happy-dom)\b|@testing-library\//
