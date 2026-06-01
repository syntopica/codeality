// A kind prefix (`use`, `format`, `map`, `validate`, `select`) only marks a
// file as that kind when it forms a camelCase word boundary: the character
// right after the prefix is an ASCII uppercase letter. This prevents false
// positives such as `user*`/`users*` matching `use`, `mapping*` matching `map`,
// `selected*`/`selection*` matching `select`, `validated*` matching `validate`,
// or `formatted*` matching `format`.
export function startsWithCamelPrefix(name: string, prefix: string): boolean {
  if (!name.startsWith(prefix)) return false
  const nextChar = name.charAt(prefix.length)
  return nextChar >= 'A' && nextChar <= 'Z'
}
