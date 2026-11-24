# codeality-go

Strict quality gate for Go modules. One command, `codeality-go gate`, runs seven
stages and fails on the first thing a reviewer would send back:

| Stage        | Tool                                 | Fails on                                                          |
| ------------ | ------------------------------------ | ----------------------------------------------------------------- |
| `format`     | `golangci-lint fmt --diff`           | a file gofumpt and gci would rewrite                              |
| `mod`        | `go mod tidy -diff`, `go mod verify` | an untidy `go.mod` or `go.sum`, a dependency that differs         |
| `lint`       | `golangci-lint run`                  | an issue under the strict `.golangci.yml` that `init` writes      |
| `structure`  | built in                             | a structural rule (below)                                         |
| `duplicates` | `jscpd`, through `npx`               | copy-pasted code over the threshold                               |
| `test`       | `go test -race -shuffle=on`          | a failing test, coverage under the floor, a suite over its budget |
| `audit`      | `govulncheck`                        | a known vulnerability the module calls                            |

A tool that is missing is exit 3, never a skipped stage.

## Install

```sh
go install github.com/syntopica/codeality/packages/codeality-go/cmd/codeality-go@latest
go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.15.0
go install golang.org/x/vuln/cmd/govulncheck@v1.10.0
```

Node is needed for the `duplicates` stage, which runs jscpd through `npx`.

The audit reports vulnerabilities in the standard library of the Go that runs
it. Keep a `toolchain` line in `go.mod` at a patched release: the generated CI
job installs the Go that `go.mod` names.

## Use

Run every command from the directory that holds `go.mod`.

```sh
codeality-go init --apply --ci   # write the configuration and the CI job
codeality-go gate                # every stage
codeality-go check               # the structural rules alone
```

- `init [--check] [--apply] [--force] [--ci]` prints what it would write and
  writes it under `--apply`. `codeality-go.yaml` is the module's own and is
  written once. `.golangci.yml` belongs to the tool down to its
  `# local overrides` line: what a module adds below that line is kept, and an
  edit above it is a conflict that only `--force` replaces. `--ci` adds the
  module's job to `.github/workflows/codeality.yml` at the repository root,
  leaving the jobs of other tools byte-identical. The job keys the Go cache from
  the module's `go.mod` and includes `go.sum` when present. `--check` exits 2 on
  a conflict.
- `check [PATH...] [--format text|json] [--fail-fast]` runs the structural rules
  and fails on any finding.
- `baseline create|update|check` records the lint, structure and duplicate
  findings a module already carries in `.codeality-go-baseline.json`; from then
  on the gate fails only on findings that are not recorded. Format, modules,
  tests and the audit have no baseline.
- `gate [--fail-fast] [--json]` runs every stage.

Exit codes: 0 clean, 1 findings, 2 configuration error, 3 a tool is missing or
failed.

## Structural rules

| Code   | Name                        | Rule                                                                                    |
| ------ | --------------------------- | --------------------------------------------------------------------------------------- |
| BGO000 | `parse-error`               | The file parses.                                                                        |
| BGO001 | `one-exported-unit`         | A file holds one exported unit: a type with its constructor and methods, or a function. |
| BGO002 | `file-matches-unit`         | The file is named after its unit, in snake case.                                        |
| BGO003 | `no-grab-bag-names`         | No `util`, `helpers`, `common`, `misc` and the like, as a package or a file.            |
| BGO004 | `max-file-lines`            | A file stays under 200 lines of code, a test file under 400.                            |
| BGO005 | `package-matches-directory` | A package is named after its directory.                                                 |
| BGO006 | `no-inline-sql`             | SQL lives in `.sql` files, not in string literals.                                      |
| BGO007 | `internal-by-default`       | A package sits under `internal/` unless it is declared public.                          |
| BGO008 | `helper-stays-local`        | An unexported helper used by a second file gets a file of its own.                      |
| BGO009 | `test-beside-unit`          | A `_test.go` file sits beside the file it tests.                                        |

There is no `//nolint` and no inline suppression: an exception is an entry in
`overrides` of `codeality-go.yaml`, with its paths and its reason.

## Configuration

`codeality-go.yaml`, beside `go.mod`. Every key but `schema-version` is
optional, and an unknown key is a configuration error.

```yaml
schema-version: 1
exclude: []
generated: []
roles:
  data: []
public-packages: []
limits:
  max-file-lines: 200
  test-max-file-lines: 400
coverage-threshold: 80
coverage-exclude: ['cmd/**']
test-budget-seconds: 120
race: true
duplicates:
  min-tokens: 70
  threshold: 1
overrides:
  - paths: ['internal/legacy/**']
    disable: [BGO004]
    reason: Scheduled for removal.
```

Coverage is counted over the whole module (`-coverpkg=./...`), so a package
tested through its callers is not at zero.
