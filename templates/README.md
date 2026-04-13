# Templates

These folders are **validated starters** for Next.js, Vite + React, Astro, and a
generic TypeScript package.

## Published dependencies

Templates depend on **`@busirocket/*` packages at `^0.1.0`**. Until those
versions are published to npm, the monorepo root may use **`pnpm.overrides`** to
pull them from GitHub; see the root [README.md](../README.md).

When you **copy a template out** of this repository, keep **npm semver** ranges,
for example:

```json
"@busirocket/eslint-config": "^0.1.0",
"@busirocket/prettier-config": "^0.1.0",
"@busirocket/tsconfig": "^0.1.0"
```

Then run `pnpm install` or `npm install`. See
[docs/migration.md](../docs/migration.md).
