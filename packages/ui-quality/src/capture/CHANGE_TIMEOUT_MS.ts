/**
 * How long a table may take to show the result of a sort or a search. Data
 * fetched by a server action lands after the network is idle, so idleness
 * alone reads the previous rows.
 */
export const CHANGE_TIMEOUT_MS = 8_000
