# Adopting the baseline in an existing repository

## 1. Inventory

- List current ESLint entrypoints (`.eslintrc.*`, `eslint.config.*`,
  FlatCompat).
- Note Prettier version and plugins.
- Note TypeScript version and `tsconfig` extends chain.

## 2. Upgrade tooling

- Move to **ESLint 9+** and **flat config** before layering
  `@busirocket/eslint-config`. This may be the largest step; treat it as its own
  milestone.
- Align TypeScript to **5.4+** if you are below that.

## 3. Install baseline packages

```bash
pnpm add -D @busirocket/eslint-config@^0.1.0 @busirocket/prettier-config@^0.1.0 @busirocket/tsconfig@^0.1.0
```

Install the packages each ESLint subpath needs. `@busirocket/eslint-config`
ships TypeScript source rather than a build, so its `import` statements resolve
from your project: a plugin missing there fails `tsc --noEmit` with
`Cannot find module '<plugin>'` before ESLint runs, even when the plugin is a
`dependencies` entry of the config package. The per-subpath list is in the
[package README](https://github.com/BusiRocket/engineering-baseline/tree/main/packages/eslint-config#stacks).

Two that are easy to miss:

- `/code-quality` composes the testing layer unconditionally, so it needs
  `eslint-plugin-testing-library` and `@vitest/eslint-plugin` even in a repo
  with no tests.
- `/nextjs` and `/vite-react` need `eslint-plugin-boundaries`, pulled in by the
  frontend-boundaries layer they compose.

On **ESLint 10**, also check the React version the config reports. The newest
published `eslint-plugin-react` (7.37.5) crashes during its own version
detection with `contextOrFilename.getFilename is not a function`, so every file
fails before a rule runs. `createNextjsConfig` and `createViteReactConfig` avoid
that by resolving the React installed beside your project and handing the plugin
a concrete version; pass `reactVersion: '19.2.0'` explicitly if your React lives
somewhere their resolution cannot reach.

**Delete any local `settings: { react: { version: 'detect' } }` block while you
are there.** An ESLint 9 era config almost certainly has one - it was the
standard way to configure the plugin - and it reinstates the detection the
factories exist to avoid, so the crash comes back on a config that looks
correctly migrated. The symptom is the whole run failing at the first file with
`Error while loading rule 'react/display-name'`, not a rule reporting anything.

## 4. Migrate ESLint

1. Add a new `eslint.config.ts` that imports from `@busirocket/eslint-config`
   and matches your stack.
2. Run `pnpm exec eslint .` and fix or suppress issues in batches.
3. Remove old ESLint config files and `eslintConfig` fields from `package.json`
   when the new config is stable.

## 5. Prettier and TypeScript

Switch `prettier.config.*` to `@busirocket/prettier-config` variants. Update
`tsconfig.json` to extend `@busirocket/tsconfig/*` and resolve duplicate
compiler options.

## 6. CI

Ensure CI runs `eslint`, `prettier --check`, and `tsc --noEmit`. Use
`create-baseline --hard` in CI if you want a strict guard that `eslint.config.*`
exists and baseline packages are listed.

## 7. Yarn

Yarn is not a supported target for documentation or CI in this baseline. Prefer
pnpm or npm.

## 8. Quality gates (knip, dependency-cruiser, lefthook, Renovate, gitleaks)

Add these after ESLint/Prettier/TypeScript are stable. Each gate, its threshold,
and how to handle a false positive are documented in
[quality-gates.md](../standards/quality-gates.md) - read that before tuning any
of them.

## Adopting on a codebase with existing violations

A large existing codebase will report thousands of violations on day one. Freeze
them instead of fixing them all up front, then let the count fall:

```bash
pnpm lint:suppress   # writes eslint-suppressions.json -- commit it
pnpm lint            # passes: existing violations are frozen, new ones fail
```

`eslint-suppressions.json` is committed deliberately: it is the shared baseline.

`lint` runs plain `eslint --max-warnings 0`. That alone is the ratchet: ESLint
checks the committed suppressions file for entries that no longer match a real
violation and fails with an explicit message when it finds one - so fixing real
debt makes its suppression stale and `lint` fails until the entry is removed
with `pnpm lint:prune`. The suppression count can therefore only go down.

Two commands must never end up inside `lint` itself:

- `--suppress-all` (the `lint:suppress` script) freezes the _current_ state.
  Re-running it to clear a failing `lint` re-freezes debt someone just paid off
  - never do that to get green.
- `--prune-suppressions` (the `lint:prune` script) looks like it belongs in the
  gate but does not: ESLint prunes the suppressions file to disk _before_ it
  evaluates whether any suppression is unused, so a `lint` run carrying that
  flag always sees a freshly emptied file and passes silently, every time.
  Putting it on the gate disables the gate. Keep it on `lint:prune`, run by a
  human after fixing debt, never on `lint`.
