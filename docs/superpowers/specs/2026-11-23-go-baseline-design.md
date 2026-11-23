# Go Baseline — Design

Date: 2026-11-23 Status: Approved by the owner in conversation (unit rule chosen
from three options); builder calls are marked.

## Goal

Give Go projects the discipline codeality already enforces for TypeScript,
Python (`codeality-py`), Rust (`cargo-baseline`), Dart (`codeality-dart`) and
Swift (`codeality-swift`): strict lint, formatting, atomic files, duplicate
detection, a debt baseline for adoption, a CI gate and estate visibility.

The bar the owner set is higher than parity: a project that passes the gate
should read as textbook Go, fit to be studied, and follow the published
standards of the language rather than a house dialect. So every rule here is
either a codeality invariant restated in Go terms or a rule taken from a named
Go source:

- [Effective Go](https://go.dev/doc/effective_go) and
  [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments).
- [Organizing a Go module](https://go.dev/doc/modules/layout) (`cmd/`,
  `internal/`).
- The Go blog on [package names](https://go.dev/blog/package-names).
- The [Google Go Style Guide](https://google.github.io/styleguide/go/) where the
  first three are silent.

The first consumer is `syntopica/worker`, which is being ported from Python to
Go and adopts the gate from its first Go commit, so there is no debt to baseline
there. The tool is its own second consumer: it passes its own gate.

Toolchain facts, checked on 2026-11-23:

| Tool          | Version | Note                                                                                           |
| ------------- | ------- | ---------------------------------------------------------------------------------------------- |
| Go            | 1.27.4  | 1.26 and 1.27 are the supported releases                                                       |
| golangci-lint | 2.15.0  | v2 config (`version: "2"`), formatters in their own section, `go install` of it is discouraged |
| govulncheck   | 1.10.0  | exits 0 under `-json`/`-format`, so the gate reads the text mode exit code                     |
| jscpd         | 5.4.3   | `go` is a supported format                                                                     |

## Non-goals

- A second linter. Everything `golangci-lint` already reports stays there;
  `codeality-go` owns only what no linter in it covers (file and package
  structure).
- IDE integration. v1 is a CLI and a CI gate.
- Type-checked rules. Structural rules read syntax only (below).
- Go workspaces (`go.work`) with several modules checked in one run. A project
  root is one `go.mod`; a repository with several runs the tool once per module.
- Duplicate detection changes for other languages.

## Anti-goals

- A green gate that did not run. A required stage whose tool is absent is an
  infrastructure failure (exit 3), never a skip.
- Go that passes the gate and reads as translated from another language. The
  unit rule below is the one place codeality's atomic-file invariant is relaxed,
  precisely so that it does not produce one-function files.
- `init` replacing a consumer's existing `.golangci.yml` silently.
- Findings reported twice. A rule that a shipped linter already enforces is not
  reimplemented.

## Shape and distribution

`packages/codeality-go`: a Go module outside the pnpm/turbo workspace, with its
own job in `.github/workflows/ci.yml`.

- Module path `github.com/syntopica/codeality/packages/codeality-go`, binary
  `cmd/codeality-go`, everything else under `internal/`.
- Parser: the standard library (`go/parser`, `go/ast`, `go/token`). CLI: the
  standard library `flag` package with subcommands. The only third-party
  dependency allowed is a YAML decoder for the config file (builder picks the
  maintained one and pins it).
- Distribution: no registry step. A module in a repository subdirectory is
  versioned by a prefixed tag, `packages/codeality-go/v<version>`, and consumers
  install it with
  `go install github.com/syntopica/codeality/packages/codeality-go/cmd/codeality-go@v<version>`.
  The repository is public, so the module proxy serves it. Tags are never moved.
- `golangci-lint` is not a Go dependency of the tool or of the consumer: its
  maintainers do not support `go install` or `tool` directives. The generated CI
  installs the pinned release binary; locally it comes from the package manager.

### Naming

Directory `codeality-go`, rule prefix `BGO`, config `codeality-go.yaml` beside
`go.mod`, baseline `.codeality-go-baseline.json`.

## Commands

Same surface and contracts as `codeality-swift`:

```
codeality-go init [--check] [--apply] [--force] [--ci]
codeality-go check [PATH...] [--format text|json] [--fail-fast]
codeality-go baseline create|update|check
codeality-go gate [--fail-fast] [--json]
```

Exit codes: 0 clean, 1 findings, 2 configuration error or `init --check`
conflict, 3 infrastructure failure. Text diagnostics:
`path:line:col: BGO001 one-exported-unit: <message>`. JSON output is versioned,
on stdout, logs on stderr.

The debt baseline follows the Dart/Swift design unchanged: three sections
(`structure`, `lint`, `duplicates`), each a multiset of fingerprints that never
include a line number. The `lint` section is parsed from
`golangci-lint run --output.json.path stdout`. Formatting, module tidiness,
tests and the audit are not baselined.

### `init` — merge or refuse

- Writes `codeality-go.yaml`.
- `.golangci.yml` missing: writes the shipped strict configuration. Present and
  identical: no-op. Present and different: a reported conflict (exit 2 under
  `--check`), replaced only with `--force`. v1 does not merge linter lists; a
  consumer that needs a local exception adds it under the marked
  `# local overrides` block, which `init` preserves.
- With `--ci`, merges a `go-<module path>` job into the git root's
  `.github/workflows/codeality.yml`, as the Dart and Swift tools do, with the
  Go, golangci-lint, govulncheck and codeality-go versions pinned.

## Structural rules (`BGO`)

| Code     | Rule                        | Enforces                                                                                                 |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `BGO000` | `parse-error`               | A file `go/parser` cannot parse is a finding, never a silent skip.                                       |
| `BGO001` | `one-exported-unit`         | An ordinary file holds exactly one unit; at most one unit in it is exported (definition below).          |
| `BGO002` | `file-matches-unit`         | The file stem is the `snake_case` of the unit's name.                                                    |
| `BGO003` | `no-grab-bag-names`         | Meaningless names banned as a package name, a directory segment or a file stem.                          |
| `BGO004` | `max-file-lines`            | Cap on occupied non-comment lines. Default 200; tests 400.                                               |
| `BGO005` | `package-matches-directory` | The package clause names the directory; lower case, no underscores or mixed caps.                        |
| `BGO006` | `no-inline-sql`             | SQL-shaped string literals banned in `.go`; queries live in `.sql` files loaded with `//go:embed`.       |
| `BGO007` | `internal-by-default`       | In a module with a `cmd/` directory, every other package lives under `internal/` unless declared public. |
| `BGO008` | `helper-stays-local`        | An unexported top-level declaration that is not the file's unit is referenced only from its own file.    |
| `BGO009` | `test-beside-unit`          | `x_test.go` sits beside `x.go` in the same directory, or is a recognised package-level test file.        |

### The unit (`BGO001`, `BGO002`, `BGO008`)

This is the Go form of "one unit per file", chosen by the owner over the strict
form used for Dart and Swift (every top-level declaration alone, private ones
included) and over no unit rule at all. Go attaches behaviour to types and keeps
small unexported helpers next to their only caller; a rule that forbids either
produces files no Go reader expects.

A **unit** is one of:

- A **type unit**: a named type declaration `T`, together with
  - its methods (receiver `T` or `*T`, generic or not);
  - its constructors: functions whose first result is `T` or `*T` (`NewLease`,
    functional options `WithTimeout` returning `Option`);
  - constant and variable declarations whose declared type is `T`, or constant
    blocks that open with a `T`-typed `iota` (Go's enum idiom);
  - the compile-time interface assertion `var _ I = (*T)(nil)`.
- A **function unit**: one top-level function.
- A **value unit**: one `const` or `var` declaration (a single spec or one
  parenthesised group). Only legal as the unit of a `data` file, or unexported.

An ordinary file contains exactly one unit that the file is named after — its
**primary** — and may also contain unexported helper units used only inside that
file. Therefore:

- `BGO001` fires when a file has two exported units, when a method's receiver
  type is declared in another file (unless the file is `methods-only`, below),
  or when no unit matches the file name and more than one candidate exists.
- `BGO002` fires when the stem is not the `snake_case` of the primary's name.
  Initialisms stay together (`HTTPServer` -> `http_server.go`, `JobID` ->
  `job_id.go`). A trailing `_<goos>`, `_<goarch>` or `_<goos>_<goarch>` build
  suffix is dropped before matching.
- `BGO008` fires when a helper is referenced from another non-test file of the
  package: a shared helper is a unit and gets its own file. Test files may reach
  any unexported name; that is what in-package tests are for.

References are matched syntactically: every file of the package directory is
parsed, and an identifier counts as a reference to a package-level name unless
it is a selector's field, a struct field key or shadowed by a local declaration
in an enclosing scope. No type checking: the tool must run before dependencies
are downloaded and on code that does not compile yet.

### Roles

Assigned before any rule runs, in this precedence, exactly one per file:
`excluded` -> `generated` -> `test` -> `doc` -> `entrypoint` -> `methods-only`
-> configured `data` -> `ordinary`.

- `excluded`: `vendor/`, `testdata/`, directories starting with `.` or `_` (the
  go command ignores the same), plus configured globs.
- `generated`: the standard marker, a line matching
  `^// Code generated .* DO NOT EDIT\.$` before the package clause, plus
  configured globs. All rules exempt. Never inferred from size.
- `test`: `*_test.go`. `BGO001`, `BGO002` and `BGO008` exempt; `BGO003`,
  `BGO005` (allowing the `_test` external package), `BGO006`, `BGO009` and the
  test line cap apply.
- `doc`: `doc.go`. Holds the package comment and the package clause, nothing
  else. A package has at most one.
- `entrypoint`: a file in `package main` that declares `func main`. The unit is
  `main`; `BGO002` requires the stem `main`. Helpers follow the ordinary rules.
- `methods-only`: no type and no function declarations, one or more methods, all
  on the same receiver type `T`, which is declared in the same package. The stem
  is `snake_case(T)` followed by `_<topic>` (`lease_expiry.go`). This is the
  escape for a type whose method set outgrows the line cap.
- `data`: configured globs. Constants, variables and `//go:embed` declarations
  only, no functions and no types; `BGO001` and `BGO002` exempt. Sentinel errors
  (`errors.go`) and embedded assets live here.

Two configured roles claiming one file is a configuration error (exit 2).

### The other rules

- `BGO003`: `util`, `utils`, `helper`, `helpers`, `misc`, `common`, `shared`,
  `base`, `types`, `interfaces`, `models`, matched case-insensitively against
  the package name, every directory segment inside the module and the file stem.
  The Go blog names the first group; the last three are the "one package for all
  the types" layout it warns against.
- `BGO005`: `main` and the `<name>_test` external test package are the two legal
  mismatches. `internal`, `cmd` and `testdata` are not package names.
- `BGO006`: the same detector as the other tools (statement keyword at the start
  of a literal plus a second SQL keyword). `sql-globs` in the config lists where
  queries may live; the default is `**/*.sql`.
- `BGO007`: applies only when the module root has a `cmd/` directory, the layout
  go.dev documents for commands. `public-packages` in the config lists the
  import paths that are deliberately importable.
- `BGO009`: recognised package-level test files are `main_test.go` (`TestMain`),
  `export_test.go`, `example_test.go`, `doc_test.go`, `bench_test.go`,
  `fuzz_test.go` and `integration_test.go`, plus configured globs. A test for a
  `methods-only` or build-suffixed file matches the same way as its subject.

## Lint and formatting

The tool ships one `.golangci.yml` (v2 format). Principles, with the exact list
a builder call:

- `linters.default: none` and an explicit `enable` list, so a golangci-lint
  upgrade never adds a rule silently. Deprecated linters are never listed.
- The list covers, at minimum: correctness (`errcheck`, `govet` with every
  analyzer, `staticcheck`, `unused`, `ineffassign`, `errorlint`, `nilerr`,
  `nilnil`, `exhaustive`, `forcetypeassert`, `bodyclose`, `rowserrcheck`,
  `sqlclosecheck`, `durationcheck`, `makezero`, `reassign`, `recvcheck`,
  `musttag`, `errchkjson`); context and concurrency (`contextcheck`, `noctx`,
  `containedctx`, `fatcontext`); errors (`err113`, `errname`, `wrapcheck`);
  security (`gosec`, `bidichk`, `asciicheck`); complexity (`funlen`, `cyclop`,
  `gocognit`, `nestif`, `interfacebloat`); API and style (`revive` with exported
  documentation required, `godoclint`, `godot`, `gocritic`, `misspell`,
  `predeclared`, `unconvert`, `unparam`, `nakedret`, `inamedparam`, `funcorder`,
  `gochecknoinits`, `gochecknoglobals`, `usestdlibvars`, `modernize`,
  `intrange`, `copyloopvar`, `perfsprint`, `sloglint`); tests (`thelper`,
  `tparallel`, `paralleltest`, `usetesting`, `testableexamples`); and
  `nolintlint` requiring a named linter and an explanation on every `//nolint`.
- Left out on purpose, each with its reason in a comment in the file: linters
  that fight idiomatic Go (`varnamelen`, `nlreturn`, `wsl_v5`, `ireturn`,
  `exhaustruct_v5`, `noinlineerr`, `nonamedreturns`), framework-specific ones,
  and `lll`, `dupl`, `gocyclo` and `maintidx`, which duplicate a stage or a
  linter that is on.
- `funlen`, `cyclop` and `gocognit` limits are set in the file and are a
  ratchet: lowered over time, never raised.
- `formatters.enable`: `gofumpt` (with `extra-rules`) and `gci` (standard,
  default, then the module's own prefix).
  `linters.exclusions.generated: strict`.
- `issues.max-issues-per-linter: 0` and `max-same-issues: 0`: a truncated report
  is a green gate that did not run.

Every enabled linter must pass on `templates/go-module` and on the tool's own
source with no `//nolint`.

## Gate stages

| Stage      | Required | Command                                                                                              |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------- |
| format     | yes      | `golangci-lint fmt --diff`; a non-empty diff is a finding whatever the exit code                     |
| mod        | yes      | `go mod tidy -diff` and `go mod verify`                                                              |
| lint       | yes      | `golangci-lint run --output.json.path stdout` (`govet` runs inside it)                               |
| structure  | yes      | `codeality-go check` (or `baseline check` when a baseline file exists)                               |
| duplicates | yes      | jscpd over the module with the `go` format                                                           |
| test       | yes      | `go test -race -shuffle=on -coverprofile=<tmp> ./...`, then a statement-coverage floor (default 80%) |
| audit      | yes      | `govulncheck ./...` in text mode, judged by its exit code                                            |

`go test -race` needs cgo and a C toolchain; a platform without one is an
infrastructure failure, not a skip. `race: false` in the config turns the flag
off for modules that cross-compile only. The coverage floor and a test-time
budget are config keys, as in `codeality-py`. The coverage total is computed
from the profile by the tool, over the packages the config does not exclude
(`cmd/**` entrypoints are excluded by default, as `main` wiring is covered by
the packages it calls).

## Duplicates

Same mechanism as Dart and Swift: `npx --yes jscpd@<pin>` with a config
generated at build time from `packages/quality-config/jscpd.json` and embedded
in the binary with `//go:embed`; a codeality CI check fails when the two
diverge. Changes to `jscpd.json`: add `"go"` to `format`, and `**/vendor/**`,
`**/testdata/**`, `**/*.pb.go` and `**/*_gen.go` to `ignore`. Node is a required
tool for this stage; missing Node is exit 3.

## Config

`codeality-go.yaml`, `schema-version: 1`. Keys: `exclude`, `generated`,
`roles.data`, `public-packages`, `sql-globs`, `test-files` (extra `BGO009`
names), `limits.max-file-lines`, `limits.test-max-file-lines`,
`coverage-threshold`, `coverage-exclude`, `test-budget-seconds`, `race`,
`duplicates.min-tokens`, `duplicates.threshold`, and `overrides` (`paths`,
`disable`, `reason`; an override without a reason is a configuration error). An
unknown key is a configuration error.

## Template

`templates/go-module`: a command under `cmd/`, two packages under `internal/`
(one type unit with a constructor and methods, one function unit with a local
helper), a `doc.go` per package, table-driven tests, `.golangci.yml` and
`codeality-go.yaml` as `init --apply` writes them. It must pass
`codeality-go gate` in codeality CI.

## codeality CI

New `go` job in `.github/workflows/ci.yml`: set up Go from
`packages/codeality-go/go.mod`, install the pinned golangci-lint and
govulncheck, `go build ./...`, then `codeality-go gate` on the tool itself and
on `templates/go-module`. `release:check` learns the
`packages/codeality-go/v<version>` tag and the CHANGELOG entry.

## Estate integration

Following `packages/create-baseline/bin/swift/`:

- `estate/findGoConsumers.mjs`: a `codeality-go.yaml`, up to 3 levels deep.
- `go/runGoConformance.mjs`: the gate job exists and its pinned versions match
  `go-versions.json`. Findings prefixed `go-`.
- `estate/formatGoEstate.mjs`: one more table in `baseline-estate`.

## Agent guidance

The shared Go rule in the owner's agent-rules repository is rewritten to state
the same standard in prose (the unit, package design, errors, context,
concurrency, testing), so that code is written to pass the gate rather than
repaired after it. It records that the Go unit rule replaces the general
one-declaration-per-file rule for `.go` files.

## Acceptance

1. `codeality-go gate` is green on its own module and on `templates/go-module`,
   locally and in CI on Ubuntu.
2. Fixture projects with known findings produce exactly those findings for each
   `BGO` code, and each of these turns a green fixture red: a second exported
   function in a file, a renamed file, a helper called from a sibling file, a
   package under the module root beside `cmd/`, an inline `SELECT`, an
   unformatted file, an untidy `go.mod`, a lint finding, a duplicated block.
3. A stage whose tool is missing exits 3.
4. `syntopica/worker` adopts the gate with `init --apply --ci` on its first Go
   commit and stays green through the port.

## Left to the builder

- The exact linter list and limits, within the principles above.
- Internal package layout of the tool (it obeys its own rules).
- The YAML decoder.
- Caching in the generated CI workflow.

## Open questions

None blocking.
