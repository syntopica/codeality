package stage_test

import (
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

func TestExecute(t *testing.T) {
	t.Parallel()

	ran := stage.Execute(t.Context(), ".", "go", "version")
	if ran.Missing || ran.ExitCode != 0 || !strings.HasPrefix(string(ran.Stdout), "go version") {
		t.Errorf("go version = %+v", ran)
	}

	if failed := stage.Execute(t.Context(), ".", "go", "no-such-command"); failed.Missing || failed.ExitCode == 0 {
		t.Errorf("a failing command = %+v", failed)
	}

	if missing := stage.Execute(t.Context(), ".", "codeality-go-no-such-tool"); !missing.Missing {
		t.Errorf("a missing tool = %+v", missing)
	}
}
