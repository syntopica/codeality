package cli_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stagetest"
)

const (
	lintIssue = `{"Issues":[{"FromLinter":"errcheck","Text":"unchecked error","SourceLines":["  call()"],` +
		`"Pos":{"Filename":"greet.go","Line":4,"Column":2}}]}`
	clone = `{"duplicates":[{"lines":12,"fragment":"a  b","firstFile":{"name":"b.go","startLoc":{"line":1,"column":1}},` +
		`"secondFile":{"name":"a.go","startLoc":{"line":5,"column":1}}}],"statistics":{"total":{"percentage":5}}}`
	halfCovered = "mode: atomic\n" +
		"example.com/fixture/greet.go:3.1,4.2 1 0\n" +
		"example.com/fixture/greet.go:5.1,6.2 1 1\n" +
		"example.com/fixture/cmd/tool/main.go:5.1,6.2 9 0\n"
)

// only is the fake tools with one command answering as given.
func only(command string, answer *stage.ToolRun) *stagetest.Tools {
	return &stagetest.Tools{Runs: map[string]stage.ToolRun{command: *answer}}
}

func TestGate(t *testing.T) {
	t.Parallel()

	dir := module(t, nil)

	for name, test := range map[string]struct {
		tools  *stagetest.Tools
		code   exitcode.Code
		stdout string
	}{
		"clean":       {tools: &stagetest.Tools{}, code: exitcode.Clean, stdout: "gate: passed"},
		"unformatted": {tools: only("golangci-lint fmt", &stage.ToolRun{ExitCode: 1, Stdout: []byte("--- a/greet.go\n+++ b/greet.go\n")}), code: exitcode.Findings, stdout: "greet.go:1:1: format"},
		"no linter":   {tools: only("golangci-lint", &stage.ToolRun{Missing: true}), code: exitcode.Infrastructure, stdout: "failed    "},
		"untidy":      {tools: only("go mod tidy", &stage.ToolRun{ExitCode: 1, Stdout: []byte("diff")}), code: exitcode.Findings, stdout: "mod-tidy"},
		"tidy broke":  {tools: only("go mod tidy", &stage.ToolRun{ExitCode: 1}), code: exitcode.Infrastructure, stdout: "failed    "},
		"unverified":  {tools: only("go mod verify", &stage.ToolRun{ExitCode: 1}), code: exitcode.Findings, stdout: "mod-verify"},
		"lint issue":  {tools: only("golangci-lint run", &stage.ToolRun{ExitCode: 1, Stdout: []byte(lintIssue)}), code: exitcode.Findings, stdout: "greet.go:4:2: errcheck"},
		"lint broke":  {tools: only("golangci-lint run", &stage.ToolRun{ExitCode: 3, Stderr: []byte("bad config")}), code: exitcode.Infrastructure, stdout: "bad config"},
		"clones":      {tools: &stagetest.Tools{Report: clone}, code: exitcode.Findings, stdout: "12 lines duplicated with a.go:5"},
		"bad report":  {tools: &stagetest.Tools{Report: "{"}, code: exitcode.Infrastructure, stdout: "unreadable jscpd report"},
		"no npx":      {tools: only("npx", &stage.ToolRun{Missing: true}), code: exitcode.Infrastructure, stdout: "failed    "},
		"red test":    {tools: only("go test", &stage.ToolRun{ExitCode: 1, Stdout: []byte("--- FAIL: TestGreet")}), code: exitcode.Findings, stdout: "--- FAIL: TestGreet"},
		"no cgo":      {tools: only("go test", &stage.ToolRun{ExitCode: 2, Stderr: []byte("go: -race requires cgo")}), code: exitcode.Infrastructure, stdout: "failed    "},
		"uncovered":   {tools: &stagetest.Tools{Profile: halfCovered}, code: exitcode.Findings, stdout: "coverage 50.0% is under the floor of 80.0%"},
		"vulnerable":  {tools: only("govulncheck", &stage.ToolRun{ExitCode: 3, Stdout: []byte("Vulnerability #1: GO-2026-0001\n")}), code: exitcode.Findings, stdout: "vulnerability: 1: GO-2026-0001"},
		"audit broke": {tools: only("govulncheck", &stage.ToolRun{ExitCode: 1}), code: exitcode.Infrastructure, stdout: "failed    "},
	} {
		code, stdout, stderr := run(t, dir, test.tools, "gate")
		if code != test.code || !strings.Contains(stdout, test.stdout) {
			t.Errorf("%s: exit %d\nstdout: %s\nstderr: %s", name, code, stdout, stderr)
		}
	}
}

func TestGateStructure(t *testing.T) {
	t.Parallel()

	dir := module(t, map[string]string{"two.go": two})

	code, stdout, _ := run(t, dir, &stagetest.Tools{}, "gate")
	if code != exitcode.Findings || !strings.Contains(stdout, "BGO001") {
		t.Errorf("exit %d\n%s", code, stdout)
	}
}

func TestGateFailFastJSON(t *testing.T) {
	t.Parallel()

	tools := only("golangci-lint fmt", &stage.ToolRun{Missing: true})

	code, stdout, _ := run(t, module(t, nil), tools, "gate", "--json", "--fail-fast")

	var report struct {
		Stages []json.RawMessage `json:"stages"`
	}
	if err := json.Unmarshal([]byte(stdout), &report); err != nil {
		t.Fatalf("not JSON: %v\n%s", err, stdout)
	}

	if code != exitcode.Infrastructure || len(report.Stages) != 1 {
		t.Errorf("exit %d with %d stages", code, len(report.Stages))
	}
}
