#!/usr/bin/env node
// Installs the project's lefthook git hooks, but only from the repository root.
//
// `prepare: lefthook install` is right for a standalone project and wrong for a
// package nested in a workspace: lefthook walks up to the enclosing repository
// and rewrites its `.git/hooks`, and pnpm runs every workspace package's
// `prepare` in parallel. In this monorepo eight templates did that at once, and
// two of them replacing the same hook raced:
// `could not replace the hook: remove .git/hooks/pre-push: no such file or directory`
// failed a CI `pnpm install --frozen-lockfile` (green on re-run). Even when it
// did not race, the last template to finish left the root's hooks pointing at
// its own lefthook binary.
//
// The repository root owns its hooks, so a nested package skips the install
// and says why. Outside any git repository (an unpacked tarball, a CI cache
// restore) there is nothing to install into, so it skips too. Any argument is
// forwarded to `lefthook install`.
import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { argv, cwd, exit, platform } from 'node:process'

const toplevel = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
})

if (toplevel.status !== 0) {
  console.log('baseline-hooks-install: not a git repository, skipped.')
  exit(0)
}

// Both paths are the invoking repository's own, from git and the working
// directory - not untrusted input. Resolved so a symlinked checkout compares
// equal to itself.
/* eslint-disable security/detect-non-literal-fs-filename */
const root = realpathSync(toplevel.stdout.trim())
const here = realpathSync(cwd())
/* eslint-enable security/detect-non-literal-fs-filename */

if (root !== here) {
  console.log(
    `baseline-hooks-install: ${here} is nested in ${root}, which owns the hooks; skipped.`,
  )
  exit(0)
}

const install = spawnSync('lefthook', ['install', ...argv.slice(2)], {
  stdio: 'inherit',
  shell: platform === 'win32',
})

exit(install.status ?? 1)
