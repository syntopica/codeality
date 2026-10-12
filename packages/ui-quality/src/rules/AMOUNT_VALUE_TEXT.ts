/** A number shown as a value, with an optional sign, currency, code or percent: "4,20", "-1.355,55 €", "$12". */
export const AMOUNT_VALUE_TEXT =
  /^[-+−]?(?:[€$£¥]\s?)?\d[\d.,\s]*(?:[€$£¥%]|\s[A-Z]{3})?$/
