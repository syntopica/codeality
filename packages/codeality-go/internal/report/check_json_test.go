package report_test

import (
	"encoding/json"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/finding"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
)

type decodedCheck struct {
	SchemaVersion int               `json:"schema_version"`
	ScannedFiles  int               `json:"scanned_files"`
	Findings      []json.RawMessage `json:"findings"`
	Summary       map[string]int    `json:"summary"`
}

func decodeCheck(t *testing.T, findings []finding.Finding) decodedCheck {
	t.Helper()

	text, err := report.CheckJSON([]string{"."}, 4, findings)
	if err != nil {
		t.Fatal(err)
	}

	var decoded decodedCheck
	if err = json.Unmarshal([]byte(text), &decoded); err != nil {
		t.Fatal(err)
	}

	return decoded
}

func TestCheckJSONClean(t *testing.T) {
	t.Parallel()

	clean := decodeCheck(t, nil)
	if clean.SchemaVersion != 1 || clean.ScannedFiles != 4 || clean.Findings == nil || clean.Summary["total"] != 0 {
		t.Errorf("clean report = %+v", clean)
	}
}

func TestCheckJSONCountsPerCode(t *testing.T) {
	t.Parallel()

	dirty := decodeCheck(t, []finding.Finding{
		{Path: "a.go", Code: "BGO001"}, {Path: "b.go", Code: "BGO001"}, {Path: "b.go", Code: "BGO004"},
	})
	if dirty.Summary["total"] != 3 || dirty.Summary["BGO001"] != 2 || len(dirty.Findings) != 3 {
		t.Errorf("summary = %v", dirty.Summary)
	}
}
