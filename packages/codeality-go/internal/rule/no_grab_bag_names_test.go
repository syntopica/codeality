package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestNoGrabBagNames(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	files := map[string]string{
		"internal/job/lease.go":        "package job\n",
		"internal/job/utils.go":        "package job\n",
		"internal/job/helpers_test.go": "package job\n",
		"internal/common/a.go":         "package common\n",
		"internal/common/b.go":         "package common\n",
		"internal/store/models/m.go":   "package rows\n",
		"internal/queue/q.go":          "package shared\n",
	}
	want := []string{
		"internal/common/a.go:1 directory:common",
		"internal/common/a.go:1 package:common",
		"internal/job/helpers_test.go:1 file:helpers",
		"internal/job/utils.go:1 file:utils",
		"internal/queue/q.go:1 package:shared",
		"internal/store/models/m.go:1 directory:models",
	}

	got := ruletest.Violations(t, rule.NoGrabBagNames(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
