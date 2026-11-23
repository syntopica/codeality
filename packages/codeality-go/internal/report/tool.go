package report

import "github.com/syntopica/codeality/packages/codeality-go/internal/version"

// tool says which build wrote a report.
type tool struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

func thisTool() tool {
	return tool{Name: "codeality-go", Version: version.Number}
}
