/** A plan node counts toward `worstEstimateRatio` only once its plan or actual rows reach this floor; a stale estimate on a handful of rows never matters. */
export const ESTIMATE_MIN_ROWS = 1000
