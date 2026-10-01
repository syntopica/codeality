/**
 * Body rows a table may render at once with no pager. Past this a list is
 * slow to paint and to scan; a virtualised table renders far fewer.
 */
export const MAX_UNPAGED_ROWS = 300
