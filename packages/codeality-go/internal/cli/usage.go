package cli

// usage is what the tool prints when asked for help or given a command it
// does not know.
const usage = `codeality-go - quality gate for Go modules

Run it from the directory that holds go.mod.

  codeality-go init [--check] [--apply] [--force] [--ci]
      Plan, and with --apply write, codeality-go.yaml, .golangci.yml and
      (--ci) the module's job in .github/workflows/codeality.yml.
  codeality-go check [PATH...] [--format text|json] [--fail-fast]
      Run the structural rules (BGO).
  codeality-go baseline create|update|check
      Record the lint, structure and duplicate findings the module carries,
      or fail on the ones that are not recorded.
  codeality-go gate [--fail-fast] [--json]
      Run every stage: format, mod, lint, structure, duplicates, test, audit.
  codeality-go version

Exit codes: 0 clean, 1 findings, 2 configuration error, 3 a tool is missing
or failed.
`
