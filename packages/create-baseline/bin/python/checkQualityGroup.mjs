const TOOL = 'busirocket-baseline-py'
const GROUP = /^\s*quality\s*=\s*\[[^\]]*busirocket-baseline-py/m

/**
 * The gate's tools must be declared as a `quality` dependency group.
 *
 * `baseline-py gate` runs ruff, mypy, deptry, pip-audit and pytest from the
 * environment it is invoked in; a project that lists only the tool cannot
 * run its gate, and one whose floor is below 3.11 cannot list it at all.
 */
export function checkQualityGroup({ pyproject }) {
  if (!pyproject.includes(TOOL)) {
    return [
      {
        id: 'py-tool',
        level: 'error',
        message: `${TOOL} is not a dependency`,
        detail: 'Add the quality group with `baseline-py init --apply`.',
      },
    ]
  }
  if (GROUP.test(pyproject)) return []
  return [
    {
      id: 'py-quality-group',
      level: 'error',
      message: `${TOOL} is declared outside the quality dependency group`,
      detail:
        'The gate needs ruff, mypy, deptry, pip-audit, pytest and pytest-cov ' +
        'beside it; `baseline-py init --apply` declares the group.',
    },
  ]
}
