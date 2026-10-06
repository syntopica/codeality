/**
 * Frames axe cannot enter: a sandbox without `allow-scripts` refuses the
 * script axe injects, and the audit then waits on that frame forever. An email
 * client's message body is the usual one. axe already reports a frame it
 * skips for a missing title, so leaving these out loses nothing it could read.
 */
export const SCRIPTLESS_SANDBOXED_FRAMES =
  'iframe[sandbox]:not([sandbox~="allow-scripts"])'
