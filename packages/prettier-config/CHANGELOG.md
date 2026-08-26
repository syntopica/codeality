# @busirocket/prettier-config

> Reconstructed from this repository's git history, which starts at the monorepo
> migration. Each entry names the commit that introduced the version.

## 0.2.0

### Minor Changes

- feat: `prettier-plugin-css-order` moves from the base config to `/frontend`
  and `/astro`.

  The base config loaded a CSS plugin, which pulls `postcss` into projects that
  have no stylesheet at all. Adopting rocket-agents, a Node CLI, Prettier
  refused to start: `Cannot find package 'postcss'`. The file's own header
  already said no frontend plugins belonged there.

  A project that formats CSS and extends the base config directly should switch
  to `@busirocket/prettier-config/frontend`, which keeps the plugin. Everything
  else needs no change and loses a dependency chain it never used.

## 0.1.2

### Patch Changes

- chore: point `repository`, `homepage` and `bugs` at the baseline monorepo.

  The published 0.1.1 tarball predates the monorepo migration, so npm still
  linked the retired standalone `BusiRocket/prettier-config` repository. Config
  content is unchanged.

## 0.1.1

### Patch Changes

- chore: republish under the `@busirocket` scope from the baseline monorepo.
  (`2acff2e`)

  The version this repository inherited at the migration; the change that
  produced it predates the monorepo. Config content is unchanged from 0.1.0.

## 0.1.0

Initial release, published before this repository existed; its history lives in
the standalone package repo that the monorepo migration replaced.
