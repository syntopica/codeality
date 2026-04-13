# Adopting the baseline in an existing repository

## 1. Inventory

- List current ESLint entrypoints (`.eslintrc.*`, `eslint.config.*`,
  FlatCompat).
- Note Prettier version and plugins.
- Note TypeScript version and `tsconfig` extends chain.

## 2. Upgrade tooling

- Move to **ESLint 9+** and **flat config** before layering
  `@busirocket/eslint-config`. This may be the largest step; treat it as its own
  milestone.
- Align TypeScript to **5.4+** if you are below that.

## 3. Install baseline packages

```bash
pnpm add -D @busirocket/eslint-config@^0.1.0 @busirocket/prettier-config@^0.1.0 @busirocket/tsconfig@^0.1.0
```

Install peer dependencies for the ESLint subpaths you will use (React, Next.js,
Astro, Tailwind, and so on).

## 4. Migrate ESLint

1. Add a new `eslint.config.ts` that imports from `@busirocket/eslint-config`
   and matches your stack.
2. Run `pnpm exec eslint .` and fix or suppress issues in batches.
3. Remove old ESLint config files and `eslintConfig` fields from `package.json`
   when the new config is stable.

## 5. Prettier and TypeScript

Switch `prettier.config.*` to `@busirocket/prettier-config` variants. Update
`tsconfig.json` to extend `@busirocket/tsconfig/*` and resolve duplicate
compiler options.

## 6. CI

Ensure CI runs `eslint`, `prettier --check`, and `tsc --noEmit`. Use
`create-baseline --hard` in CI if you want a strict guard that `eslint.config.*`
exists and baseline packages are listed.

## 7. Yarn

Yarn is not a supported target for documentation or CI in this baseline. Prefer
pnpm or npm.
