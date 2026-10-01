/**
 * Resolves once every running CSS transition and animation has finished, or
 * after 2 seconds for one that never ends (a spinner). A string, because this
 * package compiles without the DOM library.
 */
export const ANIMATIONS_SETTLED = `Promise.race([
  Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => null))),
  new Promise((resolve) => setTimeout(resolve, 2000)),
]).then(() => true)`
