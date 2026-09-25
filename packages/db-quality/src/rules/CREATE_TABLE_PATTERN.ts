/** Matches `create table ... (<body>)`, capturing the qualified name and the full column-and-constraint body. */
export const CREATE_TABLE_PATTERN =
  /^create (?:unlogged |temp(?:orary)? )?table (?:if not exists )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)\s*\(([\s\S]*)\)/
