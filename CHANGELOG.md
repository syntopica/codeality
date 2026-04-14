# eslint-plugin-code-policy

## 0.2.3

### Patch Changes

- Fix rule edge cases and false positives in one-primary-unit, inline-types, and hidden declarations rules. Support NextJS js/jsx extensions, properly handle metadata re-exports, fix ObjectPattern validation, and permit enums in runtime files.

## 0.2.2

### Patch Changes

- Widen `typescript` peer dependency from `^5.4.0` to `>=5.4.0` to support TypeScript 6.x without unmet-peer warnings.

## 0.2.1

### Patch Changes

- ### Fixed
  - Fix CI lint failure caused by ESLint traversing into `examples/` and failing to resolve unbuilt plugin imports
  - Fix `import-x/newline-after-import` lint error in test utility by removing ASI-guard semicolons

  ### Changed
  - Exclude `examples/**` from ESLint global ignores to prevent cross-project resolution errors
  - Upgrade all GitHub Actions to latest major versions (`configure-pages` v6, `deploy-pages` v5, `upload-pages-artifact` v4, `checkout` v6)
  - Enable GitHub Pages deployment for documentation site

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
