package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestOneExportedUnit(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	cfg.Roles.Data = []string{"**/errors.go"}

	files := map[string]string{
		"internal/job/lease.go": "package job\n\ntype Lease struct{}\n\nfunc NewLease() *Lease { return nil }\n\n" +
			"func (l *Lease) Expired() bool { return check(l) }\n\nfunc check(*Lease) bool { return false }\n",
		"internal/job/complete.go":     "package job\n\nfunc Complete() {}\n\nfunc Cancel() {}\n",
		"internal/job/fence.go":        "package job\n\nfunc fence() {}\n\nconst Limit = 3\n",
		"internal/job/mixed.go":        "package job\n\nfunc first() {}\n\nfunc second() {}\n",
		"internal/job/stray.go":        "package job\n\nfunc stray() {}\n\nfunc (l *Lease) Renew() {}\n",
		"internal/job/lease_expiry.go": "package job\n\nfunc (l *Lease) Left() int { return 0 }\n",
		"internal/job/ghost_text.go":   "package job\n\nfunc (g Ghost) String() string { return \"\" }\n",
		"internal/job/errors.go":       "package job\n\nimport \"errors\"\n\nvar ErrStale = errors.New(\"stale\")\n\nfunc bad() {}\n",
		"internal/job/doc.go":          "// Package job is a fixture.\npackage job\n\nconst inDoc = 1\n",
		"internal/job/lease_test.go":   "package job\n\nfunc TestA() {}\n\nfunc TestB() {}\n",
		"cmd/demo/main.go":             "package main\n\nfunc main() { run() }\n\nfunc run() {}\n",
	}
	want := []string{
		"internal/job/complete.go:5 Cancel",
		"internal/job/doc.go:4 ",
		"internal/job/errors.go:7 bad",
		"internal/job/fence.go:5 Limit",
		"internal/job/ghost_text.go:3 Ghost",
		"internal/job/mixed.go:1 ",
		"internal/job/stray.go:5 Lease.Renew",
	}

	got := ruletest.Violations(t, rule.OneExportedUnit(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
