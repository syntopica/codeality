# Migrating a project to TypeScript 7 (native compiler)

TypeScript 7 is the Go-based native compiler: ~8-12x faster full builds and a
much faster editor experience. It is NOT a drop-in upgrade, because **TS 7.0
ships no programmatic compiler API** (it lands in TS 7.1). Everything that does
`import ts from "typescript"` — typescript-eslint,
`prettier-plugin-organize-imports`, `next build`'s type-checking, `@nestjs/cli`,
`vue-tsc`, `astro check` — crashes or misbehaves if `typescript` resolves to
7.x.

Symptom when it goes wrong (eslint):

```
TypeError: Cannot read properties of undefined (reading 'Cjs')
    at .../@typescript-eslint/typescript-estree/dist/create-program/shared.js
```

The fix is Microsoft's supported **side-by-side alias layout**: the `typescript`
package name keeps resolving to 6.x for API consumers, and the native 7.x
compiler is installed under a second alias used only for type-checking.

## Can this project migrate now?

| Project shape                                                             | Migrate?                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Type-check is plain `tsc --noEmit` (Next, Vite, NestJS, plain TS package) | Yes — dual alias below                                                    |
| `vue-tsc` (Vue, Nuxt)                                                     | No — keep the REAL `typescript@^6.x` package (not the alias, see Gotchas) |
| `astro check` + `tsc`                                                     | Yes — `astro check` uses the 6.x alias, `tsc` part goes native            |
| tsconfig uses `baseUrl`, `target: es5`, AMD/UMD, `moduleResolution: node` | Fix config first (not an issue if extending `@syntopica/tsconfig`)        |

`@syntopica/tsconfig` is already TS 7-compatible (`Bundler` resolution,
`ES2024`, `strict`, no `baseUrl`), so projects extending it need **no tsconfig
changes**.

## Migration steps

1. **Swap the dependencies** in `package.json`:

   ```jsonc
   {
     "devDependencies": {
       // API consumers (eslint, organize-imports, next/nest build) keep 6.x:
       "typescript": "npm:@typescript/typescript6@^6.0.2",
       // Native compiler, used only for type-checking:
       "@typescript/native": "npm:typescript@^7.0.2",
     },
   }
   ```

   Note: the `@typescript/typescript6` compatibility alias tops out at **6.0.2**
   on npm — do not request `^6.0.3` even if regular `typescript` published it.

2. **Point `type-check` at the native binary explicitly**:

   ```jsonc
   {
     "scripts": {
       "type-check": "node node_modules/@typescript/native/bin/tsc --noEmit",
     },
   }
   ```

   Do NOT rely on `node_modules/.bin/tsc`: both packages declare a `tsc` bin and
   which one wins the `.bin` conflict is not deterministic across installs. Also
   replace any other inline `tsc --noEmit` (for example inside a `build` script)
   with the explicit native path.

3. **Install and verify** — all of these must pass before committing:

   ```bash
   pnpm install
   pnpm run type-check   # native 7.x; expect a big speedup
   pnpm run lint         # proves eslint still gets the 6.x API
   pnpm run test
   pnpm run build        # proves next/nest/astro build still gets the 6.x API
   node -e "console.log(require('typescript/package.json').version)"  # 6.0.2
   node node_modules/@typescript/native/bin/tsc --version              # 7.x
   ```

Real-world reference: `consumer-ab` commit `1e4d5bd` (2026-07-16).

## Gotchas (hit in real migrations)

- **`@typescript/typescript6` is a shim package.** Its `lib/tsc.js` is a
  one-line `require("@typescript/old/lib/tsc.js")`. Tools that read the tsc
  module file instead of importing it break on this: `vue-tsc` (volar) dies with
  `Error: Failed to locate tsc module path from shim`. That is why Vue and Nuxt
  projects must keep the real `typescript` package.
- **Monorepos: keep the resolution consistent per package.** If a workspace
  package's eslint config composes layers from a shared config package, every
  layer must resolve the same plugin instance. Mixing aliased and real
  `typescript` across that chain makes pnpm create two peer-keyed instances of
  the same plugin and ESLint fails with `Cannot redefine plugin "boundaries"`.
  Rule of thumb: within one workspace package (and the config packages it
  consumes), `typescript` is either the alias everywhere or the real package
  everywhere.
- **`eslint-plugin-sonarjs` < 4.2.0 crashes against the alias**
  (`TypeError: Cannot read properties of undefined (reading 'FunctionType')`).
  Bump to `^4.2.0` as part of the migration.

## When to undo this (and how to check)

This layout is **temporary scaffolding**. Collapse it once BOTH are true:

1. TypeScript 7.1+ is out with the stable programmatic API
   (`npm view typescript version` — Microsoft expects 7.1 ~3-4 months after 7.0,
   i.e. around 2026-10/11).
2. typescript-eslint supports TS 7
   (`npm view typescript-eslint peerDependencies` allows `typescript@7`, or
   check the typescript-eslint release notes).

Then revert to a single dependency:

```jsonc
{
  "devDependencies": {
    "typescript": "^7.1.0", // remove @typescript/native
  },
  "scripts": {
    "type-check": "tsc --noEmit",
  },
}
```

Run the same verification list. If `vue-tsc` / `astro check` / framework plugins
still fail, they have not adopted the 7.1 API yet — keep the dual alias for that
project and retry on their next release.
