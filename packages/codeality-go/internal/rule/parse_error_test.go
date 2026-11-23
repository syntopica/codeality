package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestParseError(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	files := map[string]string{
		"internal/job/good.go":   "package job\n",
		"internal/job/broken.go": "package job\n\nfunc (\n",
	}
	want := []string{"internal/job/broken.go:3 "}

	got := ruletest.Violations(t, rule.ParseError(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
