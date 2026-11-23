package scaffold

import "strings"

// insertJob returns workflow with job added at the end of its "jobs:"
// block. It works on the text, so every other line keeps its bytes and
// its comments.
func insertJob(workflow, job string) string {
	lines := strings.Split(strings.TrimSuffix(workflow, "\n"), "\n")

	end := jobsBlockEnd(lines)
	for end > 0 && end < len(lines) && strings.TrimSpace(lines[end-1]) == "" {
		end--
	}

	before := strings.Join(lines[:end], "\n")
	after := strings.Join(lines[end:], "\n")

	if after != "" {
		after += "\n"
	}

	return before + "\n" + job + after
}
