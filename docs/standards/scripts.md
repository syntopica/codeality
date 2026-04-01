# Script Contract Standard

Every project must expose this standard script vocabulary. Additional scripts are allowed but cannot replace these.

## Mandatory scripts

| Script              | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `dev`               | Start local development server                        |
| `build`             | Production build                                      |
| `start` / `preview` | Serve the production build locally                    |
| `lint`              | Run ESLint (read-only)                                |
| `lint:fix`          | Run ESLint with auto-fix                              |
| `format`            | Run Prettier (write)                                  |
| `format:check`      | Run Prettier (check only, no write)                   |
| `type-check`        | Run `tsc --noEmit`                                    |
| `test`              | Run test suite (single pass)                          |
| `test:watch`        | Run test suite in watch mode                          |
| `check:all`         | Run type-check + lint + format:check locally          |
| `check:ci`          | Run type-check + lint + format:check + test (CI gate) |

## `check:all` vs `check:ci`

`check:all` is the local pre-commit equivalent. It may skip tests for speed.
`check:ci` always includes tests. It is the required CI gate.

## Package manager

**pnpm is mandatory.** All projects must pin their package manager:

```jsonc
{
  "packageManager": "pnpm@9.15.4",
}
```

Update the pinned version when upgrading. Do not mix `npm` or `yarn` into a pnpm workspace.

## Templates vs published packages

Inside this repository, templates consume the shared packages through `workspace:*` so the baseline can validate them continuously.
Outside this repository, replace `workspace:*` with the published package versions.

## `.npmrc`

The root `.npmrc` must contain at minimum:

```text
engine-strict=true
auto-install-peers=true
```

Auth tokens must **never** be committed to `.npmrc` or any config file. Use environment variables or user-level npm config (`~/.npmrc`).
