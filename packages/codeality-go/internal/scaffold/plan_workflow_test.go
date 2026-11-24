package scaffold_test

import (
	"path/filepath"
	"strings"
	"testing"

	"go.yaml.in/yaml/v3"
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

func TestPlanWorkflowCachesModuleFiles(t *testing.T) {
	t.Parallel()

	tests := []struct {
		module     string
		job        string
		cachePaths string
	}{
		{module: ".", job: "go", cachePaths: "go.mod\ngo.sum"},
		{module: "services/billing", job: "go-services-billing", cachePaths: "services/billing/go.mod\nservices/billing/go.sum"},
	}

	for _, test := range tests {
		t.Run(test.job, func(t *testing.T) {
			t.Parallel()

			root, module := repository(t, test.module)
			write(t, filepath.Join(module, "go.mod"), "module example.com/billing\n\ngo 1.27.4\n")
			apply(t, plan(t, module, true), false)

			var workflow struct {
				Jobs map[string]struct {
					Steps []struct {
						Uses string            `yaml:"uses"`
						With map[string]string `yaml:"with"`
					} `yaml:"steps"`
				} `yaml:"jobs"`
			}

			content := read(t, filepath.Join(root, ".github", "workflows", "codeality.yml"))
			if err := yaml.Unmarshal([]byte(content), &workflow); err != nil {
				t.Fatal(err)
			}

			for _, step := range workflow.Jobs[test.job].Steps {
				if !strings.HasPrefix(step.Uses, "actions/setup-go@") {
					continue
				}

				if got := strings.TrimSpace(step.With["cache-dependency-path"]); got != test.cachePaths {
					t.Errorf("cache-dependency-path = %q, want %q", got, test.cachePaths)
				}

				return
			}

			t.Fatal("setup-go step is missing")
		})
	}
}
