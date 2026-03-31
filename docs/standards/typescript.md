# TypeScript Standard

## Mandatory flags (non-negotiable)

All projects must include these — either via `extends` or explicitly. Override at your own risk.

| Flag | Value | Reason |
|---|---|---|
| `strict` | `true` | Enables all strictness subflags |
| `noEmit` | `true` | TS is a type checker only; bundlers emit |
| `incremental` | `true` | Performance |
| `target` | `ES2024` | Modern output, no legacy transpilation |
| `module` | `ESNext` | ESM-first |
| `moduleResolution` | `Bundler` | Correct for Vite, Next, Astro |
| `resolveJsonModule` | `true` | Consistent JSON imports |
| `isolatedModules` | `true` | Required for Babel/esbuild/SWC interop |
| `esModuleInterop` | `true` | Required for most npm packages |
| `skipLibCheck` | `true` | Pragmatic — type errors in dependencies are not our problem |
| `forceConsistentCasingInFileNames` | `true` | Cross-platform correctness |
| `noUncheckedIndexedAccess` | `true` | Array/object index access returns `T \| undefined` |
| `exactOptionalPropertyTypes` | `true` | `{ a?: string }` does not accept `{ a: undefined }` |
| `noImplicitOverride` | `true` | Class overrides must be explicit |
| `useUnknownInCatchVariables` | `true` | `catch (e)` → `e: unknown` |
| `allowJs` | `false` | JS files should not exist in TS projects |

## Alias convention

One alias, everywhere: `@/*` mapped to `./src/*` for apps, `./*` for packages.

Do not introduce additional aliases unless there is a clear, documented reason.

## Extending the shared configs

```jsonc
// App (Next.js)
{ "extends": "@repo/tsconfig/nextjs.json" }

// App (Astro)
{ "extends": "@repo/tsconfig/astro.json" }

// App (Vite + React)
{ "extends": "@repo/tsconfig/vite-react.json" }

// Node / tooling package
{ "extends": "@repo/tsconfig/node.json" }
```

Always specify `include` and `exclude` in your project's own `tsconfig.json`.

## What is forbidden

- `allowJs: true` as a default — only allowed during a documented migration window
- Multiple `tsconfig.*.json` split configs unless solving a real multi-target build (document why)
- `project references` unless building a genuine multi-package monorepo that requires them
- Targets below `ES2024` in new projects
- `moduleResolution: node` or `Node16` in new projects
- Hardcoded auth tokens or secrets in any config file
