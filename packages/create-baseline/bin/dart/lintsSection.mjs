/**
 * The top-level pubspec key under which `codeality_lints` is declared, and
 * the text after its colon ('' for a map form such as `git:` or `path:`);
 * null when it is not declared.
 */
export function lintsSection(pubspec) {
  let section = null
  for (const line of pubspec.split('\n')) {
    const key = /^([a-z_]+):/i.exec(line)
    if (key) section = key[1]
    const entry = /^\s+codeality_lints:(.*)$/.exec(line)
    if (entry) return { section, constraint: entry[1].trim() }
  }
  return null
}
