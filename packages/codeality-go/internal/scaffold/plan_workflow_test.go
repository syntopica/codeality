package scaffold_test

import (
	"path/filepath"
	"strings"
	"testing"
)

const otherJob = `  dart:
    name: codeality-dart
    runs-on: ubuntu-latest
    steps:
      - run: echo dart # kept
`

func TestPlanWorkflowMergesBesideOtherJobs(t *testing.T) {
	t.Parallel()

	root, module := repository(t, "svc")
	workflow := filepath.Join(root, ".github", "workflows", "codeality.yml")
	existing := "name: codeality\non:\n  workflow_call:\njobs:\n" + otherJob
	write(t, workflow, existing)

	merged := plan(t, module, true)
	if got := dispositions(merged); !strings.Contains(got, ".github/workflows/codeality.yml=merge") {
		t.Fatalf("plan = %s", got)
	}

	apply(t, merged, false)

	after := read(t, workflow)
	if !strings.HasPrefix(after, existing) || !strings.Contains(after, "\n  go-svc:\n") {
		t.Fatalf("the merge changed another job or did not add this one:\n%s", after)
	}

	// An edited job is a conflict; forcing it restores the job and still
	// leaves the other one alone.
	write(t, workflow, strings.Replace(after, "codeality-go gate", "true", 1))

	conflicted := plan(t, module, true)
	if conflicted.Conflicts() != 1 {
		t.Fatalf("an edited job is not a conflict: %s", dispositions(conflicted))
	}

	apply(t, conflicted, true)

	if restored := read(t, workflow); restored != after {
		t.Errorf("forcing did not restore the workflow:\n%s", restored)
	}
}
