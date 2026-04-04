# Adopting the baseline in a new repository

## 1. Initialize the project

Create your app or library with your framework CLI (Next.js, Vite, Astro, and so
on). Enable TypeScript and ESM where the template allows.

## 2. Add baseline packages

```bash
pnpm add -D @vibracomet/eslint-config@^0.1.0 @vibracomet/prettier-config@^0.1.0 @vibracomet/tsconfig@^0.1.0
```

Add framework peers as required by the ESLint layers you will import (see
`@vibracomet/eslint-config` README).

## 3. Wire Prettier

Create `prettier.config.mjs`:

```javascript
export { default } from '@vibracomet/prettier-config'
```

For a frontend app with Tailwind, use `@vibracomet/prettier-config/frontend`
instead.

## 4. Wire TypeScript

Set `extends` in `tsconfig.json` to the profile that matches your stack, for
example:

```json
{
  "extends": "@vibracomet/tsconfig/nextjs.json"
}
```

## 5. Wire ESLint (flat config)

Add `eslint.config.ts` and compose layers from `@vibracomet/eslint-config` (for
example `base`, then `nextjs` or `vite-react`). Use `jiti` or your bundler to
load TypeScript if needed.

## 6. Scripts

Add scripts such as `"lint": "eslint ."`, `"format": "prettier --write ."`, and
`"type-check": "tsc --noEmit"` to `package.json`.

## 7. Optional CLI check

```bash
pnpm dlx @vibracomet/create-baseline@^0.1.0 --check
```

Use `--soft` to print install hints without failing.
