package scaffold

import (
	"path"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/version"
)

// The actions and tools the generated job pins. Actions are pinned by
// commit, tools by version: the Go checksum database fixes what a version
// is.
const (
	checkoutAction  = "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1"
	setupGoAction   = "actions/setup-go@d8cbb8045d7f43706b9177cceb36c1f91a6644d5 # v7.1.0"
	setupNodeAction = "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7"
	lintVersion     = "v2.15.0"
	auditVersion    = "v1.10.0"
)

// jobTemplate is the gate job, indented to sit under "jobs:". The Go
// version comes from the module's own go.mod.
const jobTemplate = `  {id}:
    name: codeality-go ({dir})
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: {dir}
    steps:
      - uses: {checkout}
        with:
          persist-credentials: false
      - uses: {setup-go}
        with:
          go-version-file: {go.mod}
          cache-dependency-path: {go.sum}
      # The duplicates stage runs jscpd through npx.
      - uses: {setup-node}
        with:
          node-version: 22
          package-manager-cache: false
      - name: Install the tools of the gate
        run: |
          go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@{lint}
          go install golang.org/x/vuln/cmd/govulncheck@{audit}
          go install github.com/syntopica/codeality/packages/codeality-go/cmd/codeality-go@v{tool}
      - name: Run the gate
        run: codeality-go gate
`

// renderJob returns the gate job for the module in workingDirectory,
// which is relative to the repository root.
func renderJob(workingDirectory string) string {
	return strings.NewReplacer(
		"{id}", jobID(workingDirectory),
		"{dir}", workingDirectory,
		"{checkout}", checkoutAction,
		"{setup-go}", setupGoAction,
		"{setup-node}", setupNodeAction,
		"{go.mod}", path.Join(workingDirectory, "go.mod"),
		"{go.sum}", path.Join(workingDirectory, "go.sum"),
		"{lint}", lintVersion,
		"{audit}", auditVersion,
		"{tool}", version.Number,
	).Replace(jobTemplate)
}
