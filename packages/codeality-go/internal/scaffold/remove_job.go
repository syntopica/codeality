package scaffold

import "strings"

// removeJob returns workflow without the job id: its key line under
// "jobs:" and every following line that is blank or indented deeper.
func removeJob(workflow, id string) string {
	lines := strings.Split(workflow, "\n")

	start := jobLine(lines, id)
	if start < 0 {
		return workflow
	}

	end := start + 1
	for end < len(lines) && (strings.TrimSpace(lines[end]) == "" || indent(lines[end]) > indent(lines[start])) {
		end++
	}

	// The blank lines before the next job belong to the gap, not the job.
	for end > start+1 && end < len(lines) && strings.TrimSpace(lines[end-1]) == "" {
		end--
	}

	return strings.Join(append(lines[:start:start], lines[end:]...), "\n")
}

// jobLine returns the index of the key line of the job id, or -1.
func jobLine(lines []string, id string) int {
	for index, line := range lines {
		if strings.HasPrefix(line, " ") && strings.TrimSpace(line) == id+":" {
			return index
		}
	}

	return -1
}

// indent counts the leading spaces of line.
func indent(line string) int {
	return len(line) - len(strings.TrimLeft(line, " "))
}
