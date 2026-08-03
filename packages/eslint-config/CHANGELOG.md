# @busirocket/eslint-config

> Reconstructed from this repository's git history, which starts at the monorepo
> migration. Each entry names the commit that introduced the version.

## 0.5.0

### Minor Changes

- feat!: remove the `export default` binding from every config module.
  (`d71e1dd`, version bumped in `ee83404`)

  All twelve modules exported their factory both as a named export and as a
  default. The default is gone; import the named factory
  (`import { createBaseConfig } from '@busirocket/eslint-config/base'`). Any
  consumer on a default import breaks, which is why this is a minor and not the
  patch the rest of the release would warrant.

- feat: add a `./testing` sub-export with Vitest and Testing Library rules.
  (`3907b02`)

  `@vitest/eslint-plugin` and `eslint-plugin-testing-library` join the optional
  peer dependencies.

- feat: detect import cycles at full depth. (`23d30b1`)

  `import/no-cycle` dropped its `maxDepth: 1` cap - a shallow cap misses exactly
  the long cycles that tangle large codebases. The same commit adds
  `import/extensions` to the resolver settings: `eslint-plugin-import` defaults
  to `['.js', '.mjs', '.cjs']` for its own export-map resolution, so without
  `.ts`/`.tsx`/`.jsx` listed there every rule needing that resolution silently
  reported nothing on a TypeScript codebase.

### Patch Changes

- fix: add `**/.lighthouseci/**` to the shared global ignores, so Lighthouse
  report output does not get linted. (`cb20628`)

- chore: add `publish:check` (publint + are-the-types-wrong) and the
  `lint:suppress` / `lint:prune` scripts; `lint` now runs with
  `--max-warnings 0`. (`10eefce`, `10372f4`, `fa74362`, `ffb2134`)

## 0.4.2

### Patch Changes

- chore: update dependencies to latest and align the toolchain on pnpm 11.18.0.
  (`3f383fc`)

## 0.4.1

### Patch Changes

- chore: release alongside `eslint-plugin-code-policy@0.5.1`. (`3a2c73f`)

## 0.4.0

### Minor Changes

- feat!: `eslint-plugin-boundaries` v7, stable Tailwind v4 support, dependency
  refresh. (`04a86c1`)

## 0.3.0

### Minor Changes

- feat: add the NestJS preset. (`84ecc6f`)

## 0.2.1

### Patch Changes

- chore: close the version-drift gaps found while adding the version-sync flow.
  (`8703f60`)

## 0.2.0

### Minor Changes

- feat: publish Vue support and tune the rules from real-world validation.
  (`84bb6d2`)

## 0.1.0

Initial release, published before this repository existed; its history lives in
the standalone package repo that the monorepo migration replaced.
