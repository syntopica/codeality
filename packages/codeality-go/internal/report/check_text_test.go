package report_test

import (
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/finding"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
)

func TestCheckText(t *testing.T) {
	t.Parallel()

	if got := report.CheckText(nil); got != "no findings\n" {
		t.Errorf("clean report = %q", got)
	}

	found := finding.Finding{
		Path: "a.go", Line: 3, Column: 6, Code: "BGO001", Rule: "one-exported-unit", Message: "Other is a second unit",
	}

	got := report.CheckText([]finding.Finding{found})
	if want := "a.go:3:6: BGO001 one-exported-unit: Other is a second unit\n1 findings\n"; got != want {
		t.Errorf("report = %q, want %q", got, want)
	}

	if strings.Count(got, "\n") != 2 {
		t.Error("a finding takes more than one line")
	}
}
