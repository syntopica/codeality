# Templates

These folders are **validated starters** for Next.js, Vite + React, Vite + Vue,
Nuxt 4, Astro, Tauri, a generic TypeScript package, and a Python package.

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

## python-package

`python-package` is the odd one out: it is a **uv** project, not a pnpm one, and
its quality chain is `baseline-py gate` rather than `pnpm check:ci`. It depends
on `busirocket-baseline-py` from PyPI, so its lockfile only resolves once that
package is published; see the repository [CLAUDE.md](../CLAUDE.md) for the
publish path.

```bash
uv sync --group quality
uv run baseline-py gate
```
