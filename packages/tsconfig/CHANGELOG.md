# @busirocket/tsconfig

> Reconstructed from this repository's git history, which starts at the monorepo
> migration. Each entry names the commit that introduced the version.

## 0.2.1

### Patch Changes

- chore: publish the package metadata fixed after 0.2.0 shipped.

  The published 0.2.0 tarball predates the commits that aligned the toolchain
  and added `publish:check`. No preset changed.

## 0.2.0

### Minor Changes

- feat: add a decorator-aware `nestjs.json` preset. (`84ecc6f`)

  Adds `experimentalDecorators`, `emitDecoratorMetadata` and the CommonJS module
  settings NestJS requires, as a new advertised sub-export alongside the
  existing presets.

## 0.1.2

### Patch Changes

- feat: publish Vue support and tune the presets from real-world validation.
  (`84bb6d2`)

## 0.1.1

### Patch Changes

- feat: add the `vite-vue` config. (`57d20a0`)

## 0.1.0

Initial release, published before this repository existed; its history lives in
the standalone package repo that the monorepo migration replaced.
