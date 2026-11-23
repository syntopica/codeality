package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestMaxFileLines(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	cfg.Limits.MaxFileLines = 3
	cfg.Limits.TestMaxFileLines = 4

	const body = "package job\n\n// A comment and blank lines are free.\n\nconst a = `one\ntwo`\n\nconst b = 1\n"

	files := map[string]string{
		"internal/job/short.go":     "package job\n\n// Only comments follow.\n// More.\n// More.\n",
		"internal/job/long.go":      body,
		"internal/job/long_test.go": body,
		"internal/job/huge_test.go": body + "\nconst c = 2\n",
	}
	want := []string{"internal/job/huge_test.go:1 ", "internal/job/long.go:1 "}

	got := ruletest.Violations(t, rule.MaxFileLines(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
