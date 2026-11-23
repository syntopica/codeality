package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestInternalByDefault(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	cfg.PublicPackages = []string{"example.com/demo/client"}

	files := map[string]string{
		"cmd/demo/main.go":      "package main\n\nfunc main() {}\n",
		"internal/job/lease.go": "package job\n",
		"client/client.go":      "package client\n",
		"queue/a.go":            "package queue\n",
		"queue/b.go":            "package queue\n",
		"queue/internal/x.go":   "package x\n",
		"root.go":               "package demo\n",
	}
	want := []string{"queue/a.go:1 example.com/demo/queue", "root.go:1 example.com/demo"}

	got := ruletest.Violations(t, rule.InternalByDefault(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
