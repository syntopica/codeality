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
 */
export const createLefthookConfig = (): LefthookConfig => ({
  'pre-commit': {
    parallel: true,
    commands: {
      lint: {
        glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}',
        run: 'pnpm exec eslint --max-warnings 0 --no-warn-ignored {staged_files}',
      },
      format: {
        glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs,json,md,css,yml,yaml}',
        run: 'pnpm exec prettier --check {staged_files}',
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
})
