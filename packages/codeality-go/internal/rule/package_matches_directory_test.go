package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestPackageMatchesDirectory(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	files := map[string]string{
		"root.go":                    "package demo\n",
		"internal/job/lease.go":      "package job\n",
		"internal/job/lease_test.go": "package job_test\n",
		"internal/job/other.go":      "package work\n",
		"internal/host_state/a.go":   "package host_state\n",
		"internal/hoststate/a.go":    "package hostState\n",
		"internal/wire-format/a.go":  "package wireformat\n",
		"internal/reserved/a.go":     "package internal\n",
		"cmd/demo-cli/main.go":       "package main\n",
	}
	want := []string{
		"internal/host_state/a.go:1 host_state",
		"internal/hoststate/a.go:1 hostState",
		"internal/job/other.go:1 work",
		"internal/reserved/a.go:1 internal",
	}

	got := ruletest.Violations(t, rule.PackageMatchesDirectory(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
