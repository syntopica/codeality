/** Matches `create [unique] index ... on <table> [using <method>] (<columns>)`, capturing uniqueness, the qualified table name, and the column list. */
export const CREATE_INDEX_PATTERN =
  /^create (unique )?index (?:concurrently )?(?:if not exists )?(?:\S+ )?on (?:only )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)(?: using \w+)?\s*\(([^)]*)\)/
