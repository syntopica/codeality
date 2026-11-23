package check

import (
	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/finding"
)

// Classify marks each finding new or known against the recorded debt and
// returns the comparison. Without a recorded section every finding is new.
func Classify(findings []finding.Finding, recorded *baseline.File) baseline.Classification {
	section, _ := recorded.Section(Section)

	fingerprints := make([]string, len(findings))
	for index := range findings {
		fingerprints[index] = findings[index].Fingerprint
	}

	result := baseline.Classify(section, fingerprints)
	for index, state := range result.States {
		findings[index].BaselineState = string(state)
	}

	return result
}
