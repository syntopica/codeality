/** The `sql.*` helpers that splice their argument into the query text instead of binding it. */
export const RAW_SQL_METHODS = new Set(['raw', 'lit', 'id', 'ref', 'table'])
