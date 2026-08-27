# @busirocket/tsconfig

> Reconstructed from this repository's git history, which starts at the monorepo
> migration. Each entry names the commit that introduced the version.

## 0.3.0

### Minor Changes

- feat: six correctness flags in `base.json`.

  `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `allowUnreachableCode: false`, `verbatimModuleSyntax`,
  `noPropertyAccessFromIndexSignature` and `erasableSyntaxOnly`. Each catches a
  class the existing set did not: a branch that falls off the end of a function
  typed to return a value, the classic missing `break`, a
  `process.env.SOME_TYPO` that reads as `string | undefined` rather than an
  error, and enums or parameter properties that Node's native type stripping
  cannot run.

  **Migration.** Two flags need a decision rather than a fix:

  - `noPropertyAccessFromIndexSignature` turns `process.env.PORT` into an error.
    Either switch to `process.env['PORT']`, or - where the framework requires
    the literal member expression, as Next does for inlining `NEXT_PUBLIC_*` -
    declare the variables on `NodeJS.ProcessEnv` in a `.d.ts`. The Next template
    does the latter and the declaration doubles as the app's env contract.
  - `verbatimModuleSyntax` pairs with `consistent-type-imports`, already an
    error in `@busirocket/eslint-config`, so an up-to-date project has nothing
    to change.

- feat: `nestjs.json` turns off `verbatimModuleSyntax` and `erasableSyntaxOnly`.

  Both, and only there. `nest build` emits CommonJS, so under
  `verbatimModuleSyntax` every `import`/`export` in a file TypeScript resolves
  as CJS is TS1287/TS1295; and constructor parameter properties are how
  `@nestjs/*` does dependency injection, which is not erasable syntax. The rest
  of `base.json` still applies to a NestJS service.

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
