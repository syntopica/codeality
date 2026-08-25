# @busirocket/eslint-config

> Reconstructed from this repository's git history, which starts at the monorepo
> migration. Each entry names the commit that introduced the version.

## 0.7.2

### Patch Changes

- refactor: drop the `.dependency-cruiser.cjs` rule block, keep its globals.

  `eslint-plugin-code-policy` 0.7.3 exempts that file inside the rule itself,
  which is the only place a repo composing the plugin's own preset after this
  config cannot override. `createBaseConfig` still supplies the CommonJS
  globals, which no rule can provide.

## 0.7.1

### Patch Changes

- fix: the CommonJS `.dependency-cruiser.cjs` every adopter writes now lints
  clean out of the box.

  dependency-cruiser loads CommonJS config only, while the shared factory is
  TypeScript, so the file every adopting repo creates is CJS in an otherwise ESM
  project and reaches the factory through jiti. It failed on `__filename`,
  `require` and `module` as undefined globals, and the jiti destructuring read
  as a hidden top-level declaration under the Primary Unit Rule - so every
  adopter was copying the same two relaxations into its own config.
  `createBaseConfig` supplies the CommonJS globals and
  `createCodeQualityConfig`, where the code-policy plugin is registered, turns
  off the one rule.

## 0.7.0

### Minor Changes

- feat: give test files a real size budget instead of an exemption.

  `max-lines` was `off` for `*.{test,spec}` and `__tests__/`, so a test file
  could grow without limit while production code errored at 100. It is now an
  **error at 200** (same counting: blank lines and comments skipped). The rule
  that did fire was the wrong one: `max-lines-per-function` measures the
  top-level `describe` callback, not complexity - a file with 20 trivial `it`
  cases already reported a 62-line arrow, and templates lint with
  `--max-warnings 0`, so it blocked. It is now off for test files; `max-lines`
  governs file size instead.

  `code-policy/file-kind-placement` is re-enabled for test files. It costs no
  extra code (detection is camelCase-prefix based, so a test colocated with its
  subject inherits the subject's folder) and it forbids the `tests/utils/` and
  `tests/helpers/` junk drawers that shared fixtures collect in.
  `one-primary-unit`, `no-hidden-top-level-declarations` and
  `no-inline-types-in-runtime-files` stay off: enforcing those would mean
  exporting or extracting every local builder, which is twice the code for the
  same tests.

  The override globs now also cover `tests/` and `test/`, matching
  `createTestingConfig`'s. Previously a helper under `tests/` that was not
  itself named `*.test.ts` was judged by the full production policy and got none
  of the vitest rules.

  **Breaking for existing adopters**: a repo with test files over 200 lines, or
  with shared test helpers under `utils/`/`helpers/`, will go red on upgrade.
  Split by behaviour and rename the folder semantically; see
  `docs/standards/testing.md#test-file-discipline`.

- feat: ignore test fixtures repo-wide (`tests/fixtures/**`, `__fixtures__/**`).

  A rule that reads the filesystem needs deliberately malformed sample files on
  disk. Linting them reports the very violations they exist to reproduce.

### Patch Changes

- fix: disable `tailwindcss/classnames-order` in `createTailwindConfig`.

  It fought `prettier-plugin-tailwindcss` (the class sorter in
  `@busirocket/prettier-config/frontend`): the two disagree on ordering, so a
  project running both `eslint --fix` and `prettier --write` could never pass
  `lint` and `format:check` at the same time. Prettier is the class sorter of
  record; the rule stays off. Found adopting the baseline in `consumer-t` (111
  order warnings reappeared after every prettier pass).

- fix: give root-level config files (`eslint.config.ts`, `knip.config.ts`, and
  any other `*.config.{ts,mjs,js}`) a real project to lint against.

  `createBaseConfig` set `projectService: true` with no `allowDefaultProject`,
  and template tsconfigs only `include: ["src"]`, so committing a change to a
  root config file died with "was not found by the project service" - the
  lefthook pre-commit hook, not a rule, failing. `allowDefaultProject` now
  covers those globs (capped well under typescript-eslint's 8-file match limit,
  no `**` entries). Type-aware rules are turned back off for that same file set
  via `disableTypeChecked`: the default compiler options behind
  `allowDefaultProject` don't carry the real tsconfig's module resolution, so
  every import in a config file - even `node:path` - came back as an unresolved
  "error" type and `no-unsafe-*` misfired on all of them. Also found adopting
  the baseline in `consumer-t`.

## 0.6.0

### Minor Changes

- feat: resolve the React version instead of detecting it. (`1beb68d`)

  `createNextjsConfig` and `createViteReactConfig` set `settings.react.version`
  to the version of the React installed beside the linted project, and accept a
  `reactVersion` option to override it. `'detect'` survives only as the fallback
  when resolution fails.

  This is a fix for consumers on **ESLint 10**, where the previous `'detect'`
  made `eslint-plugin-react` crash in its own version detection with
  `contextOrFilename.getFilename is not a function` before a single rule ran. It
  is a minor rather than a patch because the presets now expose a new option and
  report a different `settings.react.version` to every rule that branches on it.

### Patch Changes

- fix: ignore `.lighthouseci/` in the base config. (`cb20628`)

  Lighthouse CI report output otherwise fails a lint run that covers the whole
  project directory.

- docs: list the peer packages each export subpath needs. (`648bbe2`)

  The README `Stacks` table gained an `Install alongside` column for all twelve
  subpaths. `/code-quality` composes the testing layer unconditionally, so it
  requires `eslint-plugin-testing-library` and `@vitest/eslint-plugin` even in a
  project with no tests - previously only discoverable by hitting
  `Cannot find module` from `tsc --noEmit`.

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
