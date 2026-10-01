/**
 * Distinct texts that must stop at the same longest length before it reads as
 * a cut, unless they make up half the column. Two natural texts tie often
 * (two 30-character section titles among 45); three distinct ones rarely do.
 */
export const MIN_DISTINCT_TIES = 3
