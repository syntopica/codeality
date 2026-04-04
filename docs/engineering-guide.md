# Engineering Guide

This is the canonical engineering standard for all projects in this portfolio.
It defines the shared baseline, the framework extensions, the mandatory
conventions, and the migration path for existing projects.

When in doubt: prefer modern over legacy, explicit structure over ad hoc
flexibility, and shared defaults over per-project reinvention.

---

## Guiding principles

1. **One way to do each thing.** Where the standard has made a choice, that
   choice is not revisited per project. Consistency is more valuable than local
   optimisation.
2. **Framework extensions, not framework contamination.** Framework-specific
   rules live in their own modules. Nothing Next.js-specific belongs in the
   generic base. Nothing Astro-specific belongs in the Next.js extension.
3. **Correctness linting, not style linting.** ESLint enforces correctness and
   architecture. Prettier enforces formatting. These concerns do not overlap.
4. **Strictness by default.** TypeScript is maximally strict. Loosening flags
   requires a documented reason.
5. **No secrets in config files.** Auth tokens, API keys, and credentials must
   never be committed anywhere in the repository. Use environment variables or
   user-level config.
6. **Shared configs must resolve against the consumer project.** Any shared
   ESLint or TypeScript helper must accept the consumer root explicitly or
   default to the consumer's working directory — never the package author's
   source directory.

---

## Repository structure

```text
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
      seo.md              SEO defaults for public web projects
      performance.md      Runtime a11y and Lighthouse policy
      migration.md        How to bring existing projects onto the baseline
```

---

## How to start a new project

1. Choose the relevant template from `templates/`.
2. If you are working inside this repository, use it directly as a validated
   workspace template.
3. If you are creating an external project, copy the template and replace
   `workspace:*` dependencies with the published versions of the shared
   packages.
4. Add project-specific logic. Do not modify the inherited config structure —
   extend it.
5. If you need custom architecture boundary rules, create
   `eslint.architecture.ts` and spread it as the third layer in
   `eslint.config.ts`.
6. Run `pnpm check:all` before the first commit.

---

## ESLint composition model

```ts
// eslint.config.ts
import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createNextjsConfig } from '@vibracomet/eslint-config/nextjs' // or astro / vite-react / node
import { createCodeQualityConfig } from '@vibracomet/eslint-config/code-quality'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
]
```

Each layer adds rules. No layer loosens what a previous layer enforced.

The full layer order is: **base** (correctness + type safety + promise +
security) → **framework** (React/Next/Astro-specific) → **code-quality**
(structural: atomic files, no logic in views, no inline types, no duplication) →
**accessibility** (WCAG 2.1 AA) → **tailwind** (if applicable).

See `docs/standards/eslint.md` for the full rule taxonomy,
`docs/standards/code-quality.md` for structural rules, and
`docs/standards/accessibility.md` for a11y rules.

---

## TypeScript extension model

```jsonc
// tsconfig.json
{
  "extends": "@vibracomet/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] },
  },
  "include": ["..."],
  "exclude": ["node_modules"],
}
```

Never copy compiler flags from the shared base into your project's tsconfig.
Extend and add only what is genuinely project-specific. See
`docs/standards/typescript.md` for the full flag table.

---

## Prettier extension model

```js
// prettier.config.mjs
import frontend from '@vibracomet/prettier-config/frontend'

export default { ...frontend }
```

Available presets: `@vibracomet/prettier-config` (base: organize-imports +
css-order + Markdown wrap), `/frontend` (+ Tailwind last), `/astro` (+ Astro
parser + Tailwind last). See `docs/standards/prettier.md` for peer dependencies
and optional `tailwindConfig`.

---

## Mandatory script contract

Every project must expose: `dev`, `build`, `start/preview`, `lint`, `lint:fix`,
`format`, `format:check`, `type-check`, `test`, `test:watch`, `check:all`,
`check:ci`. Public web templates should also expose optional `test:a11y` and
`perf:check`.

`check:ci` is the CI gate. It always runs type-check + lint + format:check +
test. `perf:check` remains optional until the project has stable performance
budgets and hosting assumptions. See `docs/standards/scripts.md` for the full
contract.

---

## Standards index

- [ESLint](./standards/eslint.md)
- [Code quality](./standards/code-quality.md)
- [Accessibility](./standards/accessibility.md)
- [TypeScript](./standards/typescript.md)
- [Prettier](./standards/prettier.md)
- [Scripts & package manager](./standards/scripts.md)
- [Testing](./standards/testing.md)
- [SEO](./standards/seo.md)
- [Performance & runtime accessibility](./standards/performance.md)
- [Migration guide](./standards/migration.md)
