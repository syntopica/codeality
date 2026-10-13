// The target a rerun must reach again. An explicit URL is never echoed: it
// can hold a password, so the command reads it from `DB_URL`, which the
// person rerunning sets to the same target.
export const targetRerunFlags = (dbUrlGiven: boolean): string =>
  dbUrlGiven ? ` --db-url "$DB_URL"` : ''
