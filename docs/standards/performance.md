# Performance and Accessibility Runtime Checks

## Runtime accessibility

Static linting catches many issues, but not all of them.
For React-based templates, the baseline includes runtime accessibility tests with:

- `@testing-library/react`
- `vitest-axe`

These smoke tests are meant to catch obvious semantic and ARIA regressions early.

## Lighthouse

Public web templates also ship with optional Lighthouse CI config via `.lighthouserc.json`.
Use `pnpm perf:check` inside a template to run it.

Thresholds are intentionally moderate in the baseline:

- Accessibility: 0.90
- Best Practices: 0.90
- SEO: 0.90
- Performance: 0.60

Projects with real traffic should usually tighten these thresholds.

## CI policy

- `check:ci` must stay fast and deterministic.
- Lighthouse is optional by default because it is slower and more environment-sensitive.
- Add `perf:check` to CI once the project has stable hosting assumptions and budgets.
