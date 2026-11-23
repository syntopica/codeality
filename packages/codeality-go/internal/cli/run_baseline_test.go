package cli_test

import (
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stagetest"
)

// Debt recorded in the baseline stops failing the gate; debt that arrives
// after it still does.
func TestBaselineForgivesOnlyRecordedDebt(t *testing.T) {
	t.Parallel()

	dir := module(t, map[string]string{"two.go": two})
	indebted := &stagetest.Tools{
		Report: clone,
		Runs:   map[string]stage.ToolRun{"golangci-lint run": {ExitCode: 1, Stdout: []byte(lintIssue)}},
	}

	for _, step := range []struct {
		args   []string
		code   exitcode.Code
		stdout string
	}{
		{args: []string{"gate"}, code: exitcode.Findings, stdout: "gate: findings"},
		{args: []string{"baseline", "create"}, code: exitcode.Clean, stdout: "lint       1 recorded"},
		{args: []string{"baseline", "create"}, code: exitcode.Config},
		{args: []string{"baseline", "check"}, code: exitcode.Clean, stdout: "0 new, 1 known, 0 resolved"},
		{args: []string{"gate"}, code: exitcode.Clean, stdout: "gate: passed"},
		{args: []string{"check"}, code: exitcode.Findings, stdout: "BGO001"},
		{args: []string{"baseline", "update"}, code: exitcode.Clean, stdout: "duplicates 1 recorded"},
	} {
		code, stdout, stderr := run(t, dir, indebted, step.args...)
		if code != step.code || !strings.Contains(stdout, step.stdout) {
			t.Fatalf("%v = exit %d\nstdout: %s\nstderr: %s", step.args, code, stdout, stderr)
		}
	}

	worse := &stagetest.Tools{Report: clone, Runs: map[string]stage.ToolRun{"golangci-lint run": {
		ExitCode: 1, Stdout: []byte(strings.Replace(lintIssue, "call()", "other()", 1)),
	}}}

	code, stdout, _ := run(t, dir, worse, "baseline", "check")
	if code != exitcode.Findings || !strings.Contains(stdout, "1 new, 0 known, 1 resolved") {
		t.Errorf("new debt: exit %d\n%s", code, stdout)
	}
}

func TestBaselineRecordsNothingWhenAToolIsMissing(t *testing.T) {
	t.Parallel()

	dir := module(t, nil)

	code, _, _ := run(t, dir, only("npx", &stage.ToolRun{Missing: true}), "baseline", "create")
	if code != exitcode.Infrastructure {
		t.Errorf("exit %d", code)
	}

	if code, _, _ = run(t, dir, &stagetest.Tools{}, "baseline", "check"); code != exitcode.Config {
		t.Errorf("a baseline was written: check exits %d", code)
	}
}
