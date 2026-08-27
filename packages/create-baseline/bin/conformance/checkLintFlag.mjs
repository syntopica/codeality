const NUMERIC_BUDGET = /--max-warnings[=\s]+([1-9]\d*)/
const ZERO_BUDGET = /--max-warnings[=\s]+0(?!\d)/

/**
 * `lint` must fail on warnings.
 *
 * `docs/standards/quality-gates.md` states the invariant: "zero. There is no
 * warning budget." Without the flag, `complexity`, `max-depth`, `max-params`,
 * `max-lines-per-function` and `sonarjs/no-duplicate-string` are advisory and
 * never fail a build - which is the same as not having configured them.
 *
 * A numeric budget is reported separately and more loudly than a missing flag,
 * because it is not an oversight: it is a ratchet frozen at the day's warning
 * count that can only ever be raised. The fix for real debt is
 * `pnpm lint:suppress`, which every baseline project already has - it writes
 * the violations to `eslint-suppressions.json`, where `lint:prune` can shrink
 * them and review can see them.
 */
export function checkLintFlag({ scripts }) {
  const lint = scripts.lint
  if (!lint) {
    return [
      {
        id: 'lint-script',
        level: 'error',
        message: 'no `lint` script',
        detail: 'Nothing runs ESLint, so no rule in the baseline applies.',
      },
    ]
  }

  // A delegating script (`turbo run lint`, `pnpm -r lint`) carries the flag in
  // the packages it fans out to, not here. Reporting it against the root would
  // be a false positive on every monorepo.
  if (/\b(?:turbo|nx|lerna)\b|--recursive|\s-r\b/.test(lint)) {
    return [
      {
        id: 'lint-flag',
        level: 'info',
        message: '`lint` delegates to workspaces',
        detail:
          'Each workspace carries its own flag; this check cannot see them ' +
          'from the root. Run the conformance check inside each workspace.',
      },
    ]
  }

  const budget = NUMERIC_BUDGET.exec(lint)
  if (budget) {
    return [
      {
        id: 'lint-flag',
        level: 'error',
        message: `\`lint\` allows ${budget[1]} warnings`,
        detail:
          "A warning budget is a ratchet frozen at today's debt. Replace it " +
          'with `--max-warnings 0` and run `pnpm lint:suppress` once: the ' +
          'debt moves into eslint-suppressions.json, where `lint:prune` ' +
          'shrinks it and review can see it.',
        fix: {
          kind: 'set-script',
          name: 'lint',
          value: lint.replace(NUMERIC_BUDGET, '--max-warnings 0'),
        },
      },
    ]
  }

  if (ZERO_BUDGET.test(lint)) return []

  return [
    {
      id: 'lint-flag',
      level: 'error',
      message: '`lint` is missing `--max-warnings 0`',
      detail:
        'Every warn-level rule in the baseline is advisory until this flag ' +
        'is present.',
      fix: {
        kind: 'set-script',
        name: 'lint',
        value: `${lint.trim()} --max-warnings 0`,
      },
    },
  ]
}
