package report

import "github.com/syntopica/codeality/packages/codeality-go/internal/finding"

// checkReport is the JSON form of a structural check.
type checkReport struct {
	SchemaVersion int               `json:"schema_version"`
	Tool          tool              `json:"tool"`
	Roots         []string          `json:"roots"`
	ScannedFiles  int               `json:"scanned_files"`
	Findings      []finding.Finding `json:"findings"`
	// Summary counts the findings, in total and per rule code.
	Summary map[string]int `json:"summary"`
}

// CheckJSON renders the findings of a check over roots as versioned JSON.
func CheckJSON(roots []string, scannedFiles int, findings []finding.Finding) (string, error) {
	summary := map[string]int{"total": len(findings)}
	for index := range findings {
		summary[findings[index].Code]++
	}

	return encode(checkReport{
		SchemaVersion: schemaVersion,
		Tool:          thisTool(),
		Roots:         roots,
		ScannedFiles:  scannedFiles,
		// An empty list, never null: readers iterate it.
		Findings: append([]finding.Finding{}, findings...),
		Summary:  summary,
	})
}
