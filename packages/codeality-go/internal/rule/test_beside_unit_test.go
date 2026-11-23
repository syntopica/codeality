package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestTestBesideUnit(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	cfg.TestFiles = []string{"**/golden_test.go"}

	files := map[string]string{
		"internal/job/lease.go":           "package job\n",
		"internal/job/lease_test.go":      "package job\n",
		"internal/job/host_linux.go":      "package job\n",
		"internal/job/host_test.go":       "package job\n",
		"internal/job/main_test.go":       "package job\n",
		"internal/job/export_test.go":     "package job\n",
		"internal/job/golden_test.go":     "package job\n",
		"internal/job/everything_test.go": "package job\n",
		"internal/other/lease_test.go":    "package other\n",
	}
	want := []string{"internal/job/everything_test.go:1 everything", "internal/other/lease_test.go:1 lease"}

	got := ruletest.Violations(t, rule.TestBesideUnit(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
