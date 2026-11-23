package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestFileMatchesUnit(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	files := map[string]string{
		"internal/job/lease.go":        "package job\n\ntype Lease struct{}\n",
		"internal/job/http_server.go":  "package job\n\ntype HTTPServer struct{}\n",
		"internal/job/renamed.go":      "package job\n\nfunc CompleteAttempt() {}\n",
		"internal/job/host_linux.go":   "package job\n\nfunc host() {}\n",
		"internal/job/lease_expiry.go": "package job\n\nfunc (l *Lease) Left() int { return 0 }\n",
		"internal/job/expiry.go":       "package job\n\nfunc (l *Lease) Late() bool { return false }\n",
		"internal/job/ambiguous.go":    "package job\n\nfunc a() {}\n\nfunc b() {}\n",
		"internal/job/renamed_test.go": "package job\n\nfunc TestOther() {}\n",
		"cmd/demo/main.go":             "package main\n\nfunc main() {}\n",
		"cmd/other/server.go":          "package main\n\nfunc main() {}\n",
	}
	want := []string{
		"cmd/other/server.go:1 main",
		"internal/job/expiry.go:3 Lease",
		"internal/job/renamed.go:3 CompleteAttempt",
	}

	got := ruletest.Violations(t, rule.FileMatchesUnit(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
