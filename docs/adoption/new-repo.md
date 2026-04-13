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

## 7. Optional CLI check

```bash
pnpm dlx @busirocket/create-baseline@^0.1.0 --check
```

Use `--soft` to print install hints without failing.
