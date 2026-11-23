package scaffold_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/scaffold"
)

// repository makes a git repository with a module in sub and returns the
// module directory.
func repository(t *testing.T, sub string) (root, module string) {
	t.Helper()

	root = t.TempDir()
	module = filepath.Join(root, sub)

	for _, dir := range []string{filepath.Join(root, ".git"), module} {
		if err := os.MkdirAll(dir, 0o750); err != nil {
			t.Fatal(err)
		}
	}

	return root, module
}

func write(t *testing.T, name, content string) {
	t.Helper()

	if err := os.MkdirAll(filepath.Dir(name), 0o750); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(name, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
}

func read(t *testing.T, name string) string {
	t.Helper()

	raw, err := os.ReadFile(name)
	if err != nil {
		t.Fatal(err)
	}

	return string(raw)
}

func apply(t *testing.T, planned *scaffold.Plan, force bool) int {
	t.Helper()

	written, err := planned.Apply(force)
	if err != nil {
		t.Fatal(err)
	}

	return len(written)
}

func dispositions(plan *scaffold.Plan) string {
	parts := make([]string, len(plan.Files))
	for index, file := range plan.Files {
		parts[index] = file.Path + "=" + string(file.Disposition)
	}

	return strings.Join(parts, " ")
}

func plan(t *testing.T, module string, ci bool) *scaffold.Plan {
	t.Helper()

	planned, err := scaffold.NewPlan(module, ci)
	if err != nil {
		t.Fatal(err)
	}

	return planned
}

func TestPlanCreatesThenIsIdempotent(t *testing.T) {
	t.Parallel()

	_, module := repository(t, "services/billing")

	first := plan(t, module, true)

	want := "services/billing/codeality-go.yaml=create services/billing/.golangci.yml=create " +
		".github/workflows/codeality.yml=create .github/workflows/quality.yml=create"
	if got := dispositions(first); got != want {
		t.Fatalf("first plan = %s", got)
	}

	if wrote := apply(t, first, false); wrote != 4 {
		t.Fatalf("Apply wrote %d files", wrote)
	}

	want = "services/billing/codeality-go.yaml=unchanged services/billing/.golangci.yml=unchanged " +
		".github/workflows/codeality.yml=unchanged"
	if got := dispositions(plan(t, module, true)); got != want {
		t.Errorf("second plan = %s", got)
	}
}

func TestPlanKeepsLocalOverrides(t *testing.T) {
	t.Parallel()

	_, module := repository(t, ".")
	apply(t, plan(t, module, false), false)

	name := filepath.Join(module, ".golangci.yml")
	shipped := read(t, name)

	const override = "      - path: legacy\n        linters: [funlen]\n"

	// A local override alone is not a difference.
	write(t, name, shipped+override)

	if got := plan(t, module, false); got.Conflicts() != 0 {
		t.Fatalf("a local override is reported as a conflict: %s", dispositions(got))
	}

	// An edit above the marker is, and forcing it keeps the override.
	write(t, name, strings.Replace(shipped, "max-complexity: 10", "max-complexity: 99", 1)+override)

	conflicted := plan(t, module, false)
	if conflicted.Conflicts() != 1 {
		t.Fatalf("an edited configuration is not a conflict: %s", dispositions(conflicted))
	}

	if wrote := apply(t, conflicted, false); wrote != 0 {
		t.Error("a conflict was written without force")
	}

	apply(t, conflicted, true)

	if read(t, name) != shipped+override {
		t.Error("forcing did not restore the shipped configuration and keep the override")
	}
}
