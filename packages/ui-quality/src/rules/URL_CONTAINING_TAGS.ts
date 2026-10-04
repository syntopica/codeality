// Ancestors that already make an address actionable (a link) or that cannot
// hold a link without nesting one control inside another.
export const URL_CONTAINING_TAGS: ReadonlySet<string> = new Set([
  'a',
  'summary',
  'button',
])
