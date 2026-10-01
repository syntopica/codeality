/**
 * Orders two present values: numerically when both are numbers, otherwise
 * as a person reads text, ignoring case and accents and reading digit runs
 * as numbers.
 */
export const compareSortKeys = (
  left: number | string,
  right: number | string,
): number =>
  typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
