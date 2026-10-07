/**
 * Resolves after two animation frames: long enough for a scroll or hover
 * handler to run and start its transition. A string, because this package
 * compiles without the DOM library.
 */
export const NEXT_FRAMES = `new Promise((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))),
)`
