package scaffold

import "testing"

func TestJobID(t *testing.T) {
	t.Parallel()

	for workingDirectory, want := range map[string]string{
		".":                "go",
		"services/billing": "go-services-billing",
		"tools/gen.v2":     "go-tools-gen-v2",
	} {
		if got := jobID(workingDirectory); got != want {
			t.Errorf("jobID(%q) = %q, want %q", workingDirectory, got, want)
		}
	}
}
