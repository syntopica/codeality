# Templates

These folders are **validated starters** for Next.js, Vite + React, Astro, and a
generic TypeScript package.

## Workspace vs published dependencies

Inside the **engineering-baseline** monorepo, `package.json` files use
`workspace:*` for `@vibracomet/eslint-config`, `@vibracomet/prettier-config`,
and `@vibracomet/tsconfig` so CI can lint and build against local packages.

When you **copy a template out** of this repository, replace those entries with
**npm semver** ranges, for example:

```json
"@vibracomet/eslint-config": "^0.1.0",
"@vibracomet/prettier-config": "^0.1.0",
"@vibracomet/tsconfig": "^0.1.0"
```

Then run `pnpm install` or `npm install`. See
[docs/migration.md](../docs/migration.md).
