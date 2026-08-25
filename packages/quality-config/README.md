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

### `baseline-env-init`

Seeds a gitignored `.env` from the committed `.env.example`, so a freshly cloned
project boots on the documented example values instead of failing its startup
env validation. Bundlers inline `VITE_*`/`NEXT_PUBLIC_*` values at build time,
so without this a project with no `.env` builds a bundle that throws before it
renders and reports a blank page rather than a useful error.

```json
{
  "scripts": {
    "prepare": "lefthook install && baseline-env-init"
  }
}
```

Idempotent: an existing `.env` is never overwritten, and a project with no
`.env.example` is a no-op. It never writes a value into version control - `.env`
stays gitignored, `.env.example` stays the only committed copy.

### `baseline-dupes`

Runs the cross-file duplication gate against this package's canonical
`jscpd.json`, so no project has to commit a copy of it.

```json
{
  "scripts": {
    "dupes": "baseline-dupes ."
  }
}
```

Takes the paths to scan (default `.`); any further flag goes straight to jscpd
and wins over the config file, so `baseline-dupes . --min-tokens 120` works.
List-valued flags **replace** the config's list rather than merging into it -
`--ignore` hands jscpd a whole new ignore set - but `gitignore: true` is on, so
a project's own ignored directories stay out either way. jscpd 5.x is a Rust
binary that reads JSON only - it has no JS config loader - which is why this
gate ships as a config file plus a runner rather than as a factory like
`createKnipConfig`. Point another tool at the same file through
`@busirocket/quality-config/jscpd`.

`jscpd` itself stays a devDependency of the consuming project: the runner
invokes it, it does not vendor it.

## Related

- **Lint / TS configs:** `@busirocket/eslint-config`, `@busirocket/tsconfig`.
