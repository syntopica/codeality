# @busirocket/create-baseline

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
