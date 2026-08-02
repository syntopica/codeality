# @busirocket/quality-config

Shared configuration factories for cross-file quality gates: unused
files/exports/dependencies (knip), module boundaries and dependency cycles
(dependency-cruiser), type coverage, and the shared git hook pipeline
(lefthook).

- **Public API (semver):** see [PUBLIC_API.md](./PUBLIC_API.md).
- **Platform decisions:**
  [engineering-baseline/docs/platform-decisions.md](https://github.com/BusiRocket/engineering-baseline/blob/main/docs/platform-decisions.md).

## Requirements

- Node.js 22+
- TypeScript 5.4+
- `knip` and `dependency-cruiser` as needed per gate (optional peers, listed in
  `package.json`)

## Install

```bash
pnpm add -D @busirocket/quality-config@^0.1.0 typescript
```

Add `knip` and/or `dependency-cruiser` for the gates you use.

## Usage

| Import subpath                                  | Use case                                  |
| ----------------------------------------------- | ----------------------------------------- |
| `@busirocket/quality-config`                    | All factories and constants, re-exported  |
| `@busirocket/quality-config/knip`               | Unused files/exports/dependencies gate    |
| `@busirocket/quality-config/dependency-cruiser` | Module boundary and dependency-cycle gate |
| `@busirocket/quality-config/type-coverage`      | Minimum non-`any` type coverage threshold |
| `@busirocket/quality-config/lefthook`           | Shared git hook pipeline                  |

## Related

- **Lint / TS configs:** `@busirocket/eslint-config`, `@busirocket/tsconfig`.
