// A quoted column whose name says money, then its type and any (precision,
// scale). Group 1 is the name, 2 the type, 3 the scale.
/** A money-named column definition in compiled DDL, as PostgreSQL, MySQL or SQLite quotes it. */
export const MONEY_COLUMN_PATTERN =
  /["`]([^"`]*(?:amount|price|total|fee)[^"`]*)["`]\s+(real|float\d*|double(?:\s+precision)?|numeric|decimal)\b(?:\s*\(\s*\d+\s*(?:,\s*(\d+)\s*)?\))?/gi
