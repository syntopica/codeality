/**
 * A number as a cell shows an amount: one run of digits and separators,
 * optionally with a currency symbol, a percent sign or a three-letter
 * currency code set apart by a space. "B66543778" and "CB-1095182" are
 * identifiers, not amounts.
 */
export const AMOUNT_TEXT =
  /^(?:[A-Z]{3}\s|[A-Z]{0,2}[$€£¥]\s?)?[-+]?\d[\d.,\s]*(?:[A-Z]{0,2}[$€£¥]|%|\s[A-Z]{3})?$/
