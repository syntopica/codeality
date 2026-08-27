const VERSION = /(\d+)\.(\d+)\.(\d+)/

/**
 * The lowest version a dependency range admits, as `[major, minor, patch]`.
 *
 * Comparing floors is the honest question for baseline drift. `^0.1.2` cannot
 * resolve `0.2.0` at all - under semver a caret on a `0.x` line is locked to
 * the minor - so a repository on `^0.1.2` will never receive the published
 * `0.2.0` no matter how often Renovate runs, and its floor says so without
 * needing a resolver or a network call.
 *
 * Returns `null` for a range with no concrete version in it (`workspace:*`,
 * `*`, `latest`, a git or file specifier). Those are deliberate choices, not
 * drift, and the caller skips them.
 */
export function rangeFloor(range) {
  if (typeof range !== 'string') return null
  if (range.startsWith('workspace:')) return null
  if (range.startsWith('npm:')) return rangeFloor(range.slice(4))
  const match = VERSION.exec(range)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}
