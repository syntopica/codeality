/**
 * A code identifier printed as a label: camelCase ("taxRate"), snake_case
 * ("vat_rate", letter-only words) or a key and an id ("purchase:7905"). Brand casing such as
 * "iPhone" or "eBay" has a single lower-case letter before the capital.
 */
export const IDENTIFIER_TEXT =
  /^(?:[a-z]{2,}(?:[A-Z][a-z0-9]+)+|[a-z]+(?:_[a-z]+)+|[a-z][a-z_]*:\d+)$/
