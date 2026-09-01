const TOOL = 'busirocket-baseline-py'
const LOCKED = /^name = "busirocket-baseline-py"\nversion = "([^"]+)"/m

/**
 * The lockfile must pin the current release of the tool.
 *
 * A consumer's uv.lock holds the version, and `uv lock --check` passes as
 * long as the range allows it - which is how two repositories sat on 0.1.0
 * and 0.1.7 through a sweep that believed it had upgraded everything. A
 * consumer on an old pin runs the old stages silently.
 */
export function checkLockPin({ lock, versions }) {
  const expected = versions[TOOL]
  if (!expected) return []
  if (!lock) {
    return [
      {
        id: 'py-lock',
        level: 'error',
        message: 'no uv.lock',
        detail:
          'Run `uv lock` and commit the result; CI installs with --locked.',
      },
    ]
  }
  const locked = LOCKED.exec(lock)?.[1]
  if (locked === expected) return []
  return [
    {
      id: 'py-lock',
      level: 'error',
      message: `uv.lock pins ${TOOL} ${locked ?? 'nowhere'}, current is ${expected}`,
      detail: `Run \`uv lock --upgrade-package ${TOOL}\` and commit the result.`,
    },
  ]
}
