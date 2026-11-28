import type { LefthookOptions } from './LefthookOptions'
import { TADU_BACKLOG_PATHS } from './TADU_BACKLOG_PATHS'

/** Shape of a lefthook.yml configuration document. */
type LefthookConfig = Record<string, unknown>

/**
 * Git hook configuration.
 *
 * pre-commit is limited to staged files and skips type-check and tests
 * deliberately: CI already covers both, and a hook that takes 40 seconds gets
 * disabled within a week.
 *
 * lefthook reads YAML, not TypeScript, so this factory is not consumed
 * directly by lefthook itself. It mirrors the root and per-template
 * `lefthook.yml` files by hand — see the comment at the top of those files —
 * and is what create-baseline uses to generate `lefthook.yml` for new
 * projects it scaffolds.
 *
 * With `tadu`, the file checks exclude the backlog (tadu writes JSON that
 * prettier rejects) and a `backlog` command runs `tadu doctor .` on it,
 * skipped when tadu is not installed.
 */
export const createLefthookConfig = ({
  tadu = false,
}: LefthookOptions = {}): LefthookConfig => {
  const exclude = tadu ? { exclude: TADU_BACKLOG_PATHS } : {}
  return {
    'pre-commit': {
      parallel: true,
      commands: {
        'lint:fast': {
          glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}',
          ...exclude,
          run: 'pnpm exec oxlint --deny-warnings {staged_files}',
        },
        lint: {
          glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}',
          ...exclude,
          run: 'pnpm exec eslint --max-warnings 0 --no-warn-ignored {staged_files}',
        },
        format: {
          glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs,json,md,css,yml,yaml}',
          ...exclude,
          run: 'pnpm exec prettier --check {staged_files}',
        },
        ...(tadu
          ? {
              backlog: {
                glob: TADU_BACKLOG_PATHS,
                skip: [{ run: '! command -v tadu' }],
                run: 'tadu doctor .',
              },
            }
          : {}),
      },
    },
    // The release tooling reads the commit type to pick the semver bump and to
    // build the changelog, so a mistyped subject is a silent release defect.
    // This is the only place it can be caught: by the time the tag is cut the
    // message is already history.
    'commit-msg': {
      commands: {
        commitlint: {
          run: 'pnpm exec commitlint --edit {1}',
        },
      },
    },
    'pre-push': {
      commands: {
        secrets: {
          run: 'gitleaks detect --no-banner --redact',
        },
      },
    },
  }
}
