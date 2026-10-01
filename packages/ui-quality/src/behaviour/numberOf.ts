import { AMOUNT_TEXT } from '@/behaviour/AMOUNT_TEXT.js'

/**
 * The number a cell shows, with its currency, unit and grouping removed, or
 * null when it is not one. The last of "," and "." is the decimal mark,
 * except a lone "." before exactly three digits, which groups thousands.
 */
export const numberOf = (text: string): number | null => {
  const bare = text.replace(/[^\d,.\-+]/g, '')
  if (!AMOUNT_TEXT.test(text)) return null
  const lastComma = bare.lastIndexOf(',')
  const lastDot = bare.lastIndexOf('.')
  const decimalMark =
    lastComma > lastDot
      ? ','
      : lastDot >= 0 && !/^[-+]?\d{1,3}(?:\.\d{3})+$/.test(bare)
        ? '.'
        : null
  const grouping = decimalMark === ',' ? /\./g : /,/g
  const normalized = bare
    .replace(decimalMark === null ? /[.,]/g : grouping, '')
    .replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}
