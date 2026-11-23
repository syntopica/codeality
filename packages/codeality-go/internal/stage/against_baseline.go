package stage

import "github.com/syntopica/codeality/packages/codeality-go/internal/baseline"

// againstBaseline marks the items of result new or known against the
// section of its name, and sets the status: with a recorded section only
// new items fail the stage; without one, any item does.
func againstBaseline(result *Result, recorded *baseline.File) {
	section, _ := recorded.Section(result.Name)

	fingerprints := make([]string, len(result.Items))
	for index := range result.Items {
		fingerprints[index] = result.Items[index].Fingerprint
	}

	compared := baseline.Classify(section, fingerprints)
	for index, state := range compared.States {
		result.Items[index].BaselineState = string(state)
	}

	result.New, result.Known, result.Resolved = compared.New, compared.Known, compared.Resolved

	result.Status = StatusPassed
	if compared.New > 0 {
		result.Status = StatusFindings
	}
}
