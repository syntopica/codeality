# my-nestjs-app

NestJS service scaffolded on the BusiRocket engineering baseline.

## Stack

- **NestJS 11** (Express platform)
- **ESLint** via `@busirocket/eslint-config` (`base` + `nestjs` +
  `code-quality`)
- **TypeScript** via `@busirocket/tsconfig/nestjs.json` (decorators enabled)
- **Prettier** via `@busirocket/prettier-config`
- **Vitest** for tests

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `pnpm start:dev`    | Run in watch mode                        |
| `pnpm build`        | Compile to `dist/` with `nest build`     |
| `pnpm start:prod`   | Run the compiled server                  |
| `pnpm type-check`   | `tsc --noEmit` against the strict config |
| `pnpm lint`         | ESLint over `src`                        |
| `pnpm format:check` | Prettier check                           |
| `pnpm test`         | Run the Vitest suite                     |
| `pnpm check:all`    | type-check + lint + format check         |

## Notes

- Type-checking uses the strict, `noEmit` baseline config; `nest build` uses
  `tsconfig.build.json`, which emits CommonJS to `dist/`.
- The `nestjs` ESLint preset disables `consistent-type-imports` and relaxes
  `no-extraneous-class` so NestJS decorator metadata and module classes work
  with the strict base rules.
- Tests instantiate providers directly. For dependency-injected tests with
  `@nestjs/testing`, add a SWC transform (e.g. `unplugin-swc`) so Vitest emits
  decorator metadata.
