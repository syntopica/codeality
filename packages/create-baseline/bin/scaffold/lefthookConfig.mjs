// The git hooks every baseline project runs: lint and format on the staged
// files at commit, secret scan before push. Mirrors createLefthookConfig() in
// @busirocket/quality-config/lefthook.
export function lefthookConfig() {
  return `# Mirrors createLefthookConfig() in @busirocket/quality-config/lefthook.
pre-commit:
  parallel: true
  commands:
    lint:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs}'
      run: pnpm exec eslint --max-warnings 0 --no-warn-ignored {staged_files}
    format:
      glob: '*.{js,jsx,ts,tsx,vue,astro,mjs,cjs,json,md,css,yml,yaml}'
      run: pnpm exec prettier --check {staged_files}

pre-push:
  commands:
    secrets:
      run: gitleaks detect --no-banner --redact
`
}
