// The git hooks every baseline project runs: lint and format on the staged
// files at commit, secret scan before push. Mirrors createLefthookConfig() in
// @syntopica/quality-config/lefthook.
//
// With `tadu`, the backlog is left to `tadu doctor`: tadu writes JSON that
// prettier rejects, so the file checks exclude it and a `backlog` command
// validates it instead.
export function lefthookConfig({ tadu = false } = {}) {
  const exclude = tadu
    ? `
      exclude:
        - todo/**
        - TODO.md
        - TODO_LOG.md
        - TODO_HISTORY_INDEX.jsonl`
    : ''
  const backlog = tadu
    ? `
    backlog:
      glob:
        - todo/**
        - TODO.md
        - TODO_LOG.md
        - TODO_HISTORY_INDEX.jsonl
      skip:
        - run: '! command -v tadu'
      run: tadu doctor .
`
    : ''
  return `# Mirrors createLefthookConfig() in @syntopica/quality-config/lefthook.
pre-commit:
  parallel: true
  commands:
    lint:fast:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}'${exclude}
      run: pnpm exec oxlint --deny-warnings {staged_files}
    lint:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}'${exclude}
      run: pnpm exec eslint --max-warnings 0 --no-warn-ignored {staged_files}
    format:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs,json,md,css,yml,yaml}'${exclude}
      run: pnpm exec prettier --check {staged_files}${backlog}

# The release tooling reads the commit type to pick the semver bump and to
# build the changelog, so a mistyped subject is a silent release defect. This
# is the only place it can be caught: by the time the tag is cut the message
# is already history.
commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}

pre-push:
  commands:
    secrets:
      run: gitleaks detect --no-banner --redact
`
}
