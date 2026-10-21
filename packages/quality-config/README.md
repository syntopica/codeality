# @syntopica/quality-config

Shared configuration factories for cross-file quality gates: unused
files/exports/dependencies (knip), module boundaries and dependency cycles
(dependency-cruiser), type coverage, and the shared git hook pipeline
(lefthook).

- **Public API (semver):** see [PUBLIC_API.md](./PUBLIC_API.md).
- **Platform decisions:**
  [engineering-baseline/docs/platform-decisions.md](https://github.com/syntopica/codeality/blob/main/docs/platform-decisions.md).

## Requirements

- Node.js 22+
- TypeScript 5.4+
- `knip` and `dependency-cruiser` as needed per gate (optional peers, listed in
  `package.json`)

## Install

```bash
pnpm add -D @syntopica/quality-config typescript
```

Add `knip` and/or `dependency-cruiser` for the gates you use.

## Usage

| Import subpath                                 | Use case                                  |
| ---------------------------------------------- | ----------------------------------------- |
| `@syntopica/quality-config`                    | All factories and constants, re-exported  |
| `@syntopica/quality-config/knip`               | Unused files/exports/dependencies gate    |
| `@syntopica/quality-config/dependency-cruiser` | Module boundary and dependency-cycle gate |
| `@syntopica/quality-config/type-coverage`      | Minimum non-`any` type coverage threshold |
| `@syntopica/quality-config/lefthook`           | Shared git hook pipeline                  |

### `knip --production`

Every preset marks its runtime entries and source globs with knip's production
suffix (`!`) and leaves configuration files unmarked, and tests, mocks and
stories are excluded in production mode only. `knip --production` then starts
from the code that ships: a dependency only a test imports, or a build plugin in
`dependencies`, is reported there, while the default run is unchanged. A
`project` or `entry` glob you pass that holds runtime code needs the `!` too
(`'components/**/*.tsx!'`); unmarked, it is left out of the production run.

Preset entry files that do not exist and preset patterns matching no files are
omitted. A tooling package with only `scripts/` therefore does not inherit
unmatched `src/` patterns. Pass its actual roots through `entry` and `project`;
caller patterns are preserved so Knip can report mistakes in them. Paths resolve
against `cwd`, which defaults to the process working directory.

ESLint compatibility exemptions apply only when the project declares
`@syntopica/eslint-config`. Projects with their own ESLint configuration retain
unused-dependency checking for those packages and can add explicit
`ignoreDependencies` entries when needed.

### Module boundaries on the resolved graph

`createDepCruiserConfig({ moduleRoots: ['src/features'] })` treats each child of
`src/features` as a module and fails any file in one module that reaches a file
of another module other than its `index`. It runs on resolved paths, so an
alias, a re-export or a relative `../../` are all caught the same way, which
code-policy's `public-api-imports` and `no-cross-module-deep-imports` cannot do
from the import string. Off unless roots are named.

### `baseline-env-init`

Seeds a gitignored `.env` from the committed `.env.example`, so a freshly cloned
project boots on the documented example values instead of failing its startup
env validation. Bundlers inline `VITE_*`/`NEXT_PUBLIC_*` values at build time,
so without this a project with no `.env` builds a bundle that throws before it
renders and reports a blank page rather than a useful error.

```json
{
  "scripts": {
    "prepare": "baseline-hooks-install && baseline-env-init"
  }
}
```

Idempotent: an existing `.env` is never overwritten, and a project with no
`.env.example` is a no-op. It never writes a value into version control - `.env`
stays gitignored, `.env.example` stays the only committed copy.

### `baseline-hooks-install`

Runs `lefthook install`, but only when the package is the root of its git
repository. A package nested in a workspace skips the install, because lefthook
would rewrite the enclosing repository's `.git/hooks`, and pnpm runs every
workspace package's `prepare` in parallel: two packages replacing the same hook
at once fail the install. Outside a git repository it skips too. Arguments are
forwarded to `lefthook install`.

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

Takes the paths to scan (a bare `baseline-dupes` scans `.`); every other
argument is forwarded to jscpd in the order given and wins over the config file,
so `baseline-dupes . --min-tokens 120` works. Pass the path explicitly when you
pass flags - the runner does not try to tell a path from a flag's value.

To keep the shared ignores and add your own, use `--also-ignore`:

```json
{
  "scripts": {
    "dupes": "baseline-dupes . --also-ignore \"**/src/types/supabase/**\""
  }
}
```

jscpd's own `--ignore` **replaces** the config's list rather than merging into
it (measured: a config that also ignored `**/cargo-baseline/**` scanned 61 files
and found 1 clone; adding an unrelated `--ignore` took it to 109 files and 4
clones). Without `--also-ignore`, a project with one generated directory to
exclude would have to restate every shared pattern in its own script, which is
the duplication this runner exists to remove. `--also-ignore` merges through a
generated config that is deleted again on the way out; it extends your own
`--config` when you pass one. jscpd 5.x is a Rust binary that reads JSON only -
it has no JS config loader - which is why this gate ships as a config file plus
a runner rather than as a factory like `createKnipConfig`. Point another tool at
the same file through `@syntopica/quality-config/jscpd`.

`jscpd` itself stays a devDependency of the consuming project: the runner
invokes it, it does not vendor it.

## Related

- **Lint / TS configs:** `@syntopica/eslint-config`, `@syntopica/tsconfig`.
