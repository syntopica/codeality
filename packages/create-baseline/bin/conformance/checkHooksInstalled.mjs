/**
 * A committed `lefthook.yml` is not an installed hook.
 *
 * lefthook only writes into `.git/hooks` when `lefthook install` runs, which
 * is why `prepare` exists. Three repositories in a row adopted the gates with
 * the file in place and no hook installed, and one common cause is silent:
 * pnpm blocks a dependency's install scripts unless `allowBuilds` names it, so
 * `lefthook` never gets to install itself and the only sign is an
 * `ERR_PNPM_IGNORED_BUILDS` line scrolled past during install.
 *
 * A missing hook is a warning, not an error - CI is what makes a gate
 * mandatory, and a hook that fires only on the author's machine was never the
 * enforcement mechanism. It is still worth naming: it is the difference
 * between catching a violation before the commit and catching it after the
 * push.
 */
export function checkHooksInstalled({ hooks, deps }) {
  if (hooks.installed) return []

  if (!deps.lefthook) {
    return [
      {
        id: 'hooks',
        level: 'warn',
        message: 'lefthook is not installed',
        detail: 'No pre-commit lint or pre-push secret scan on this machine.',
      },
    ]
  }

  return [
    {
      id: 'hooks',
      level: 'warn',
      message: 'lefthook.yml is present but .git/hooks is not wired',
      detail:
        'Run `pnpm run prepare`. If pnpm reports ERR_PNPM_IGNORED_BUILDS for ' +
        'lefthook, add `lefthook: true` under `allowBuilds:` in ' +
        'pnpm-workspace.yaml first - otherwise the hooks never reach ' +
        '.git/hooks however many times you run it.',
    },
  ]
}
