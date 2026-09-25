/** Matches `alter table <table> add [constraint <name>] primary key|unique (<columns>)`, capturing the qualified table name, the constraint kind, and the column list. */
export const ALTER_KEY_PATTERN =
  /^alter table (?:if exists )?(?:only )?((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?) add (?:constraint \S+ )?(primary key|unique)\s*\(([^)]*)\)/
