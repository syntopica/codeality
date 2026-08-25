# @busirocket/create-baseline

## 0.4.0

### Minor Changes

- feat: `create-baseline --write` scaffolds the wiring instead of describing it.

  The tool could tell you `lefthook.yml` was missing and never write it, so
  every adopting repo hand-wrote the same four files and the same ten scripts.
  Measured across seven real adoptions in one sitting: the only thing that
  varied was the knip preset, which is read off the project's dependencies, and
  which directories to exempt from `no-orphans`.

  `--write` creates `knip.config.ts`, `lefthook.yml`, `renovate.json` and
  `.dependency-cruiser.cjs` when absent, and adds the baseline scripts
  `package.json` does not already define. Nothing that exists is overwritten and
  re-running is a no-op, so it is safe on a half-adopted repo.

- chore: `baseline-versions.json` now pins `dependency-cruiser`, `jiti` and
  `type-coverage`.

  `--write` generates a `.dependency-cruiser.cjs` that reaches the shared
  factory through jiti, and a `type-coverage` script behind
  `baseline-type-coverage`. Without these three on the install line the
  generated wiring fails on its first run.

## 0.3.9

### Patch Changes

- chore: refresh the `@busirocket/quality-config` pin to `^0.7.0`. Derived from
  the workspace by `pnpm sync-versions`.

## 0.3.8

### Patch Changes

- chore: refresh the `eslint-plugin-code-policy` and `@busirocket/eslint-config`
  pins. Derived from the workspace by `pnpm sync-versions`.

## 0.3.7

### Patch Changes

- chore: refresh the `@busirocket/eslint-config` pin to `^0.7.1`. Derived from
  the workspace by `pnpm sync-versions`; no check was added or removed.

## 0.3.6

### Patch Changes

- chore: refresh the `@busirocket/quality-config` pin to `^0.6.1`. Derived from
  the workspace by `pnpm sync-versions`; no check was added or removed.

## 0.3.5

### Patch Changes

- chore: refresh the `eslint-plugin-code-policy` pin to `^0.7.2`, which stops
  `file-kind-placement` firing on test files. Derived from the workspace by
  `pnpm sync-versions`; no check was added or removed.

## 0.3.4

### Patch Changes

- chore: refresh the pins injected into scaffolded projects.

  `eslint-plugin-code-policy` `^0.7.0` -> `^0.7.1` and
  `@busirocket/quality-config` `^0.5.0` -> `^0.6.0`, both carrying fixes found
  by running the 0.7.0 / 0.5.0 build against the repos that adopt it. Derived
  from the workspace by `pnpm sync-versions`; no check was added or removed.

## 0.3.3

### Patch Changes

- chore: refresh the pins injected into scaffolded projects.

  `@busirocket/eslint-config` `^0.6.0` -> `^0.7.0`, `eslint-plugin-code-policy`
  `^0.6.0` -> `^0.7.0`, and `@busirocket/quality-config` `^0.4.0` -> `^0.5.0`.
  Derived from the workspace by `pnpm sync-versions`; no check was added or
  removed.

## 0.3.2

### Patch Changes

- chore: refresh the pins in `baseline-versions.json`.

  `@busirocket/eslint-config` to `^0.6.0` and `@busirocket/quality-config` to
  `^0.3.0`. No check was added or removed.

## 0.3.1

### Patch Changes

- chore: refresh the pins in `baseline-versions.json`.

  `@busirocket/quality-config` to `^0.2.0`, `@busirocket/prettier-config` to
  `^0.1.2`, `@busirocket/tsconfig` to `^0.2.1`. No check was added or removed.

## 0.3.0

### Minor Changes

- feat: require the quality-gate half of the baseline.

  `baseline-versions.json` now also pins `@busirocket/quality-config`, `knip`
  and `lefthook`, and `--hard` additionally requires `knip.config.ts`/`.js`,
  `lefthook.yml` and `renovate.json` to exist. A project that passed `--check`
  or `--hard` on 0.2.1 will fail until it adopts those - that is the point of
  the ratchet, but it is a behavior change, not a patch.

  Pins bumped in the same file: `@busirocket/eslint-config` to `^0.5.0`,
  `eslint-plugin-code-policy` to `^0.6.0`.

### Patch Changes

- fix: stop requiring `@busirocket/tsconfig` where it cannot apply.

  A project whose own `tsconfig.json` extends a config inside a dot-directory -
  build output its framework regenerates, such as Nuxt's
  `./.nuxt/tsconfig.json` - has no insertion point for the shared presets, so
  demanding the dependency only added a package nothing reads, which an
  unused-dependency gate then reports as dead weight.

  The exemption is narrow: an authored `./tsconfig.base.json` still requires the
  package, so does a project with no `tsconfig.json`, and a `tsconfig.json` that
  cannot be parsed as JSON is treated as authored so an unreadable file never
  silently drops the requirement.

- fix: drop the `dependency-cruiser` pin consumers could not meet.
