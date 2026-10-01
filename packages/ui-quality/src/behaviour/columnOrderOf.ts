import type { ColumnOrder } from '@/behaviour/ColumnOrder.js'
import { compareSortKeys } from '@/behaviour/compareSortKeys.js'
import type { SortKey } from '@/behaviour/SortKey.js'

/** Whether the present values of a column run up, down or neither. */
export const columnOrderOf = (keys: SortKey[]): ColumnOrder => {
  const present = keys.filter((key): key is number | string => key !== null)
  const steps = present
    .slice(1)
    .map((key, index) =>
      Math.sign(compareSortKeys(present[index] as number | string, key)),
    )
  if (!steps.some((step) => step !== 0)) return 'flat'
  if (steps.every((step) => step <= 0)) return 'asc'
  if (steps.every((step) => step >= 0)) return 'desc'
  return 'none'
}
