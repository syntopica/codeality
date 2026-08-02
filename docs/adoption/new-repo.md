# Adopting the baseline in a new repository

## 1. Initialize the project

Create your app or library with your framework CLI (Next.js, Vite, Astro, and so
on). Enable TypeScript and ESM where the template allows.

## 2. Add baseline packages

```bash
pnpm add -D @busirocket/eslint-config@^0.1.0 @busirocket/prettier-config@^0.1.0 @busirocket/tsconfig@^0.1.0
```

Add framework peers as required by the ESLint layers you will import (see
`@busirocket/eslint-config` README).

## 3. Wire Prettier

Create `prettier.config.mjs`:

```javascript
export { default } from '@busirocket/prettier-config'
```

For a frontend app with Tailwind, use `@busirocket/prettier-config/frontend`
instead.

## 4. Wire TypeScript

Set `extends` in `tsconfig.json` to the profile that matches your stack, for
example:

```json
{
  "extends": "@busirocket/tsconfig/nextjs.json"
}
```

## 5. Wire ESLint (flat config)

Add `eslint.config.ts` and compose layers from `@busirocket/eslint-config` (for
example `base`, then `nextjs` or `vite-react`). Use `jiti` or your bundler to
load TypeScript if needed.

## 6. Scripts

Add scripts such as `"lint": "eslint ."`, `"format": "prettier --write ."`, and
`"type-check": "tsc --noEmit"` to `package.json`.

## 7. Wire the quality gates

Add `@busirocket/quality-config` and generate the per-project config files from
its factories, instead of copying JSON by hand:

```bash
pnpm add -D @busirocket/quality-config@^0.1.0 knip dependency-cruiser lefthook
```

```ts
// knip.config.ts
import { createKnipConfig } from '@busirocket/quality-config/knip'

export default createKnipConfig({ framework: 'nextjs' }) // or vite-react, astro, vue, nuxt, node, nestjs
```

`lefthook.yml` and `renovate.json` are plain YAML/JSON, not TypeScript factories
loaded at runtime - copy them from the closest matching template under
`templates/*/lefthook.yml` and `templates/*/renovate.json` (or from
`createLefthookConfig()` in `@busirocket/quality-config/lefthook` if generating
them programmatically), then run `pnpm exec lefthook install`.

`dependency-cruiser` only pays off once there is more than one package to graph;
a single-package repo can skip `deps:graph` until it becomes a monorepo. Every
gate's threshold and rationale is in
[quality-gates.md](../standards/quality-gates.md).

## 8. Optional CLI check

```bash
pnpm dlx @busirocket/create-baseline@^0.1.0 --check
```

Use `--soft` to print install hints without failing, or `--hard` to also require
an `eslint.config.*` and the quality-gate config files (`knip.config.ts`/`.js`,
`lefthook.yml`, `renovate.json`) to exist.
