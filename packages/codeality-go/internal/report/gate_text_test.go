package report_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

func TestGateText(t *testing.T) {
	t.Parallel()

	results := []stage.Result{
		{Name: "format", Command: "golangci-lint fmt --diff", Status: stage.StatusPassed, Seconds: 0.25},
		{
			Name: "lint", Command: "golangci-lint run", Status: stage.StatusFindings, Seconds: 2, New: 1, Known: 1,
			Items: []stage.Item{
				{Code: "errcheck", Message: "unchecked error", Path: "a.go", Line: 4, Column: 2, BaselineState: "new"},
				{Code: "errcheck", Message: "old debt", Path: "b.go", Line: 9, Column: 2, BaselineState: "known"},
			},
		},
		{Name: "audit", Command: "govulncheck ./...", Status: stage.StatusFailedToRun, Detail: "tool not found: govulncheck"},
	}

	want := "passed    format (0.2s) golangci-lint fmt --diff\n" +
		"findings  lint (2.0s) golangci-lint run\n" +
		"  1 new, 1 known, 0 resolved\n" +
		"  a.go:4:2: errcheck: unchecked error\n" +
		"failed    audit (0.0s) govulncheck ./...\n" +
		"  tool not found: govulncheck\n" +
		"gate: failed to run (exit 3)\n"

	if got := report.GateText(results, exitcode.Infrastructure); got != want {
		t.Errorf("report =\n%s\nwant\n%s", got, want)
	}

	if got := report.GateText(nil, exitcode.Clean); got != "gate: passed (exit 0)\n" {
		t.Errorf("clean verdict = %q", got)
	}

	if got := report.GateText(nil, exitcode.Findings); got != "gate: findings (exit 1)\n" {
		t.Errorf("findings verdict = %q", got)
	}
}
