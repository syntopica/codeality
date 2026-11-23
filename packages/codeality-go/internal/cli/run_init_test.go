package cli_test

import (
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stagetest"
)

func TestInit(t *testing.T) {
	t.Parallel()

	dir := module(t, map[string]string{".golangci.yml": "version: \"2\"\n"})

	for _, step := range []struct {
		args   []string
		code   exitcode.Code
		stdout string
	}{
		{args: []string{"init"}, code: exitcode.Config, stdout: "conflict  .golangci.yml"},
		{args: []string{"init", "--check"}, code: exitcode.Config, stdout: "create    codeality-go.yaml"},
		{args: []string{"init", "--apply"}, code: exitcode.Config, stdout: "wrote 1 files"},
		{args: []string{"init", "--apply", "--force", "--ci"}, code: exitcode.Clean, stdout: "wrote 3 files"},
		{args: []string{"init", "--check", "--ci"}, code: exitcode.Clean, stdout: "unchanged .github/workflows/codeality.yml"},
		{args: []string{"init", "--bogus"}, code: exitcode.Config},
	} {
		code, stdout, stderr := run(t, dir, &stagetest.Tools{}, step.args...)
		if code != step.code || !strings.Contains(stdout, step.stdout) {
			t.Fatalf("%v = exit %d\nstdout: %s\nstderr: %s", step.args, code, stdout, stderr)
		}
	}
}

func TestInitNeedsAModule(t *testing.T) {
	t.Parallel()

	if code, _, _ := run(t, t.TempDir(), &stagetest.Tools{}, "init", "--apply"); code != exitcode.Config {
		t.Errorf("exit %d outside a module", code)
	}
}
