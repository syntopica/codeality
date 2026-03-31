# Engineering Guide

This is the canonical engineering standard for all projects in this portfolio.
It defines the shared baseline, the framework extensions, the mandatory conventions,
and the migration path for existing projects.

When in doubt: prefer modern over legacy, explicit structure over ad hoc flexibility,
and shared defaults over per-project reinvention.

---

## Guiding principles

1. **One way to do each thing.** Where the standard has made a choice, that choice is not revisited per project. Consistency is more valuable than local optimisation.
2. **Framework extensions, not framework contamination.** Framework-specific rules live in their own modules. Nothing Next.js-specific belongs in the generic base. Nothing Astro-specific belongs in the Next.js extension.
3. **Correctness linting, not style linting.** ESLint enforces correctness and architecture. Prettier enforces formatting. These concerns do not overlap.
4. **Strictness by default.** TypeScript is maximally strict. Loosening flags requires a documented reason.
5. **No secrets in config files.** Auth tokens, API keys, and credentials must never be committed anywhere in the repository. Use environment variables or user-level config.

---

## Repository structure

```
engineering-baseline/
  packages/
    eslint-config/        Shared ESLint configs (base + framework extensions)
    tsconfig/             Shared TypeScript configs (base + framework variants)
    prettier-config/      Shared Prettier configs (base + frontend + astro)
  templates/
    nextjs-app/           Starter config set for a new Next.js app
    astro-site/           Starter config set for a new Astro site
    vite-react-app/       Starter config set for a new Vite + React app
    ts-package/           Starter config set for a new TS-only package/tool
  docs/
    engineering-guide.md  This file
    standards/
      eslint.md           ESLint decisions and layer model
      typescript.md       TypeScript flags and extension model
      prettier.md         Prettier config and plugin policy
      scripts.md          Mandatory script contract and package manager policy
      testing.md          Test runner policy (Vitest default, Jest exception)
      migration.md        How to bring existing projects onto the baseline
```

---

## How to start a new project

1. Copy the relevant template from `templates/`.
2. Install dependencies with `pnpm install`.
3. Add project-specific logic. Do not modify the inherited config structure — extend it.
4. If you need custom architecture boundary rules, create `eslint.architecture.ts` and spread it as the third layer in `eslint.config.ts`.
5. Run `pnpm check:all` before the first commit.

---

## ESLint composition model

```ts
// eslint.config.ts
import base from '@repo/eslint-config/base'
import nextjs from '@repo/eslint-config/nextjs'        // or astro / vite-react / node
import architecture from './eslint.architecture.ts'    // optional, project-specific

export default [...base, ...nextjs, ...architecture]
```

Each layer adds rules. No layer loosens what a previous layer enforced.
See `docs/standards/eslint.md` for the full rule taxonomy.

---

## TypeScript extension model

```jsonc
// tsconfig.json
{
  "extends": "@repo/tsconfig/nextjs.json",   // or astro / vite-react / node
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["..."],
  "exclude": ["node_modules"]
}
```

Never copy compiler flags from the shared base into your project's tsconfig.
Extend and add only what is genuinely project-specific.
See `docs/standards/typescript.md` for the full flag table.

---

## Prettier extension model

```js
// prettier.config.mjs
import frontend from '@repo/prettier-config/frontend'

export default { ...frontend }
```

Available presets: `@repo/prettier-config` (base), `/frontend` (+ Tailwind), `/astro` (+ Tailwind + Astro parser).
See `docs/standards/prettier.md` for the plugin policy.

---

## Mandatory script contract

Every project must expose: `dev`, `build`, `start/preview`, `lint`, `lint:fix`,
`format`, `format:check`, `type-check`, `test`, `test:watch`, `check:all`, `check:ci`.

`check:ci` is the CI gate. It always runs type-check + lint + format:check + test.
See `docs/standards/scripts.md` for the full contract.

---

## Standards index

- [ESLint](./standards/eslint.md)
- [TypeScript](./standards/typescript.md)
- [Prettier](./standards/prettier.md)
- [Scripts & package manager](./standards/scripts.md)
- [Testing](./standards/testing.md)
- [Migration guide](./standards/migration.md)
