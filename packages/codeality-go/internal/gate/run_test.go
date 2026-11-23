package gate_test

import (
	"context"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/gate"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

func ending(name string, status stage.Status) stage.Stage {
	return stage.Stage{Name: name, Run: func(context.Context, *stage.Env) stage.Result {
		return stage.Result{Name: name, Status: status}
	}}
}

func TestRun(t *testing.T) {
	t.Parallel()

	stages := []stage.Stage{
		ending("a", stage.StatusPassed),
		ending("b", stage.StatusFindings),
		ending("c", stage.StatusFailedToRun),
	}

	all := gate.Run(t.Context(), stages, &stage.Env{}, false)
	if len(all) != 3 || gate.ExitCode(all) != exitcode.Infrastructure {
		t.Errorf("full run = %d stages, exit %d", len(all), gate.ExitCode(all))
	}

	fast := gate.Run(t.Context(), stages, &stage.Env{}, true)
	if len(fast) != 2 || gate.ExitCode(fast) != exitcode.Findings {
		t.Errorf("fail-fast run = %d stages, exit %d", len(fast), gate.ExitCode(fast))
	}

	if gate.ExitCode(all[:1]) != exitcode.Clean {
		t.Error("a passing run is not clean")
	}
}
