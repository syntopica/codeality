/** A schema-qualified or bare SQL identifier, quoted or not: `schema.table`, `"Schema"."Table"`, or `table`. */
export const INDEX_NAME_PATTERN = /^(?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?/
