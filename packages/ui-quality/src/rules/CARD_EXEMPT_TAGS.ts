/** Rounded, padded boxes that are controls or layers, never cards. */
export const CARD_EXEMPT_TAGS = new Set([
  'button',
  'input',
  'select',
  'textarea',
  'dialog',
  'summary',
])
