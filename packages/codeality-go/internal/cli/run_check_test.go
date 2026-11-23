package cli_test

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stagetest"
)

func TestCheck(t *testing.T) {
	t.Parallel()

	clean := module(t, nil)
	dirty := module(t, map[string]string{"two.go": two, "inner/two.go": strings.Replace(two, "fixture", "inner", 1)})

	for _, test := range []struct {
		dir    string
		args   []string
		code   exitcode.Code
		stdout string
	}{
		{dir: clean, args: []string{"check"}, code: exitcode.Clean, stdout: "no findings"},
		{dir: dirty, args: []string{"check"}, code: exitcode.Findings, stdout: "two.go:"},
		{dir: dirty, args: []string{"check", "inner", "--fail-fast"}, code: exitcode.Findings, stdout: "1 finding"},
		{dir: dirty, args: []string{"check", "greet.go"}, code: exitcode.Clean, stdout: "no findings"},
		{dir: dirty, args: []string{"check", "--format", "xml"}, code: exitcode.Config},
		{dir: dirty, args: []string{"check", "--format"}, code: exitcode.Config},
	} {
		code, stdout, stderr := run(t, test.dir, &stagetest.Tools{}, test.args...)
		if code != test.code || !strings.Contains(stdout, test.stdout) {
			t.Errorf("%v = exit %d\nstdout: %s\nstderr: %s", test.args, code, stdout, stderr)
		}
	}
}

func TestCheckJSON(t *testing.T) {
	t.Parallel()

	dir := module(t, map[string]string{"two.go": two})

	code, stdout, _ := run(t, dir, &stagetest.Tools{}, "check", "--format", "json")

	var report struct {
		Roots    []string `json:"roots"`
		Findings []struct {
			Code string `json:"code"`
			Path string `json:"path"`
		} `json:"findings"`
	}
	if err := json.Unmarshal([]byte(stdout), &report); err != nil {
		t.Fatalf("not JSON: %v\n%s", err, stdout)
	}

	if code != exitcode.Findings || len(report.Roots) != 1 || len(report.Findings) == 0 || report.Findings[0].Path != "two.go" {
		t.Errorf("exit %d, report %+v", code, report)
	}
}

func TestCheckOutsideAModule(t *testing.T) {
	t.Parallel()

	if code, _, _ := run(t, t.TempDir(), &stagetest.Tools{}, "check"); code != exitcode.Config {
		t.Errorf("exit %d outside a module", code)
	}
}
