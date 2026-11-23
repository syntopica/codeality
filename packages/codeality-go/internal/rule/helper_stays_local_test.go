package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestHelperStaysLocal(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	files := map[string]string{
		"internal/job/lease.go": "package job\n\ntype Lease struct{}\n\nfunc local() {}\n\nfunc shared() {}\n\n" +
			"const (\n\tquiet = 1\n\tloud  = 2\n)\n",
		"internal/job/renew.go":      "package job\n\nfunc Renew() { shared(); fence(); _ = loud }\n",
		"internal/job/fence.go":      "package job\n\nfunc fence() {}\n",
		"internal/job/shadow.go":     "package job\n\nfunc Shadow(local int) int { return local }\n",
		"internal/job/field.go":      "package job\n\nfunc Field(l Lease) { _ = l.quiet }\n",
		"internal/job/lease_test.go": "package job\n\nfunc TestLocal() { local() }\n",
		"internal/other/local.go":    "package other\n\nfunc Use() { local() }\n",
	}
	want := []string{"internal/job/lease.go:7 shared", "internal/job/lease.go:9 loud"}

	got := ruletest.Violations(t, rule.HelperStaysLocal(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
