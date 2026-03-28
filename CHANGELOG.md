# eslint-plugin-code-policy

## 0.2.0

### Minor Changes

- 5964bd2: Initial public release of `eslint-plugin-code-policy`.

  Introduces architectural linting for TypeScript projects:
  - `atomic-file` — enforce one exported symbol per file
  - `explicit-barrel-exports` — require explicit re-exports in index files
  - `no-cross-module-imports` — prevent direct cross-module imports
  - `no-default-export` — ban default exports
  - `no-inline-type` — disallow inline type aliases
  - `view-logic-separation` — separate view and logic concerns

  Ships with four ready-to-use config presets: `recommended`, `strict`, `react`, and `next`.
