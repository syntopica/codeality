# Templates

These folders are **validated starters** for Next.js, Vite + React, Astro, and a
generic TypeScript package.

## Published dependencies

Templates depend on **`@vibracomet/*` packages at `^0.1.0`**. Until those
versions are published to npm, the monorepo root may use **`pnpm.overrides`** to
pull them from GitHub; see the root [README.md](../README.md).

When you **copy a template out** of this repository, keep **npm semver** ranges,
for example:

```json
"@vibracomet/eslint-config": "^0.1.0",
"@vibracomet/prettier-config": "^0.1.0",
"@vibracomet/tsconfig": "^0.1.0"
```

Then run `pnpm install` or `npm install`. See
[docs/migration.md](../docs/migration.md).
