/** PostgreSQL's `create type ... as enum`, or MySQL's `enum(...)` column type. */
export const NATIVE_ENUM_PATTERN =
  /\bcreate\s+type\b[^;]+\bas\s+enum\b|\benum\s*\(/i
