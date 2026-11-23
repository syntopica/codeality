package scaffold

import "strings"

// jobID returns the id of the job init owns for the module in
// workingDirectory: "go" at the repository root, "go-<path>" below it, so
// that a repository with several modules gets a job for each.
func jobID(workingDirectory string) string {
	if workingDirectory == "." {
		return "go"
	}

	slug := strings.Map(func(char rune) rune {
		switch {
		case char >= 'a' && char <= 'z', char >= 'A' && char <= 'Z', char >= '0' && char <= '9', char == '_':
			return char
		default:
			return '-'
		}
	}, workingDirectory)

	return "go-" + slug
}
