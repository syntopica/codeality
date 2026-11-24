/** A segment that only tells the user what to do next, or that ends in "manually". */
export const GENERIC_TAIL =
  /^(?:please try again|try again later|try again|contact support|refresh the page)$|manually$/
