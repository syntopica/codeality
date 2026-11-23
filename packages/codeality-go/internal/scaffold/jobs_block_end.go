package scaffold

import "strings"

// jobsBlockEnd returns the index of the first line after the "jobs:" block
// of lines: the next top-level key, or the end.
func jobsBlockEnd(lines []string) int {
	inJobs := false

	for index, line := range lines {
		switch {
		case strings.HasPrefix(line, "jobs:"):
			inJobs = true
		case inJobs && line != "" && !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "#"):
			return index
		}
	}

	return len(lines)
}
