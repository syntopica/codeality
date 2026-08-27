import { rangeFloor } from './rangeFloor.mjs'

/**
 * An installed range must be able to resolve the version this CLI pins.
 *
 * `baseline-versions.json` is the shipped source of truth: it travels with the
 * CLI, so the check needs no registry call and gives the same answer offline
 * and in CI.
 *
 * The failure this catches is quiet by design. Thirteen repositories sat on
 * `@busirocket/prettier-config@^0.1.2` against a published `0.2.0`, and
 * Renovate cannot close that gap on its own - a caret on a `0.x` line is
 * locked to the minor, so the range has to be widened by hand before any
 * update tool can see the new version at all. Nothing anywhere reported it.
 */
export function checkVersionRanges({ deps, versions }) {
  const findings = []

  for (const [name, pinned] of Object.entries(versions)) {
    const installed = deps[name]
    if (installed == null) continue

    const have = rangeFloor(installed)
    const want = rangeFloor(pinned)
    if (!have || !want) continue

    if (compare(have, want) >= 0) continue

    const stuck = want[0] === 0 && have[0] === 0 && have[1] < want[1]
    findings.push({
      id: `version:${name}`,
      level: stuck ? 'error' : 'warn',
      message: `${name} ${installed} is behind ${pinned}`,
      detail: stuck
        ? 'A caret on a 0.x line is locked to the minor, so this range can ' +
          'never resolve the pinned version. Widen it by hand; no update tool ' +
          'will do it for you.'
        : 'Within range - a plain install will pick the newer version up.',
      fix: { kind: 'set-dependency', name, value: pinned },
    })
  }

  return findings
}

function compare(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1
  }
  return 0
}
