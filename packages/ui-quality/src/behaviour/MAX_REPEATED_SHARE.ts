/**
 * Share of a next page's items already shown on the first page above which
 * the pager is reported: pages that repeat items are an unstable order under
 * LIMIT and OFFSET, and the items they push out are never shown at all.
 */
export const MAX_REPEATED_SHARE = 0.5
