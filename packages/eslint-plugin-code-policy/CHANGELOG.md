# eslint-plugin-code-policy

## 0.5.2

### Patch Changes

- chore: update `@typescript-eslint/utils` to 8.65 and align toolchain
  dependency ranges.

## 0.5.1

### Patch Changes

- refactor: extract the exempt-filename guard shared by `atomic-file` and
  `one-primary-unit` into a single `isExemptEntryFilename` util. The two inline
  copies had already diverged once (`proxy.ts`); behavior is unchanged, and the
  exemption list can no longer drift between the rules.

## 0.5.0

### Minor Changes

- feat(file-kind-placement): add an `allowColocation` option.

  The rule enforced type-based grouping for every placement-checked unit (a
  `use*` hook, `map*` mapper, `format*` formatter, etc.) by requiring a matching
  semantic folder (`hooks/`, `mappers/`, ...) anywhere in its path. That
  conflicts with feature-folder / colocation architecture, where a
  single-consumer hook or util lives next to its consumer rather than in a
  dedicated technical folder.

  The new `allowColocation` option (default `false`, preserving the strict
  policy) exempts a unit when it is colocated with its consumer: the containing
  folder holds an _anchor_ alongside the file — a public-API barrel (`index.*`),
  a component (`PascalCase.tsx`/`.jsx`), or any neighbouring code file that is
  not itself a placement-checked kind (the consumer). A unit orphaned in a
  purely technical folder with no anchor still flags. Enable with
  `['error', { allowColocation: true }]` (composes with `allowGenericFolders`).

## 0.4.4

### Patch Changes

- fix(file-kind-placement): only treat a kind prefix as that kind at a camelCase
  word boundary.

  The kind detection used bare `startsWith`, so identifiers like `userCache`,
  `usersScope`, or `userLockTtlMs` were misreported as hooks (they start with
  `use`), `mapping` as a mapper, and `selected`/`validated`/`formatted` as their
  respective kinds. Prefixes (`use`, `format`, `map`, `validate`, `select`) now
  only match when the next character is uppercase, so `useSync`/`mapEntry` still
  flag while `user*`/`mapping`/`selected` no longer produce false positives.

## 0.4.3

### Patch Changes

- feat(file-kind-placement): recognize Next.js `_`-private folders and add an
  `allowGenericFolders` option.

  Folder matching is now `_`-prefix aware: `_hooks/` is treated as `hooks/`,
  `_utils/` as `utils/`, etc., so `use*` units in Next.js private folders are no
  longer reported as misplaced (and `_utils/` is consistently treated as a
  generic folder). A new `allowGenericFolders` option (default `false`, keeping
  the strict semantic-folder policy) permits `utils/` and `helpers/` at any
  depth as homes for pure helpers; files under such a folder are then exempt
  from placement checks — enable it with
  `['error', { allowGenericFolders: true }]` in projects that organize helpers
  as `utils/<area>/`.

## 0.4.2

### Patch Changes

- refactor: type all rules with TSESTree via a typed `createRule` factory
  (removes internal `any` usage); the package is now linted and type-checked in
  CI.

## 0.3.0

### Minor Changes

- feat: add `no-mixed-barrel` rule to prevent mixing re-exports and inline
  declarations in barrel files

  Barrel files must be either pure re-export hubs or pure declaration files —
  not both. This new rule catches the common mistake of adding `export function`
  / `export const` declarations alongside `export { ... } from` re-exports in
  the same file, which undermines the module-boundary guarantees the plugin
  enforces.

## 0.2.4

### Patch Changes

- Allow semantic folders to contain subdirectories (e.g. `hooks/ai/...`) in
  file-kind-placement rule.

## 0.2.3

### Patch Changes

- Fix rule edge cases and false positives in one-primary-unit, inline-types, and
  hidden declarations rules. Support NextJS js/jsx extensions, properly handle
  metadata re-exports, fix ObjectPattern validation, and permit enums in runtime
  files.

## 0.2.2

### Patch Changes

- Widen `typescript` peer dependency from `^5.4.0` to `>=5.4.0` to support
  TypeScript 6.x without unmet-peer warnings.

## 0.2.1

### Patch Changes

- ### Fixed
  - Fix CI lint failure caused by ESLint traversing into `examples/` and failing
    to resolve unbuilt plugin imports
  - Fix `import-x/newline-after-import` lint error in test utility by removing
    ASI-guard semicolons

  ### Changed
  - Exclude `examples/**` from ESLint global ignores to prevent cross-project
    resolution errors
  - Upgrade all GitHub Actions to latest major versions (`configure-pages` v6,
    `deploy-pages` v5, `upload-pages-artifact` v4, `checkout` v6)
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

  Ships with four ready-to-use config presets: `recommended`, `strict`, `react`,
  and `next`.
