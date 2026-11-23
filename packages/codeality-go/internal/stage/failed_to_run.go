package stage

import (
	"fmt"
	"strings"
)

// failedToRun reports a stage whose tool is missing or crashed.
func failedToRun(name string, run *ToolRun) Result {
	detail := fmt.Sprintf("exit %d: %s", run.ExitCode, strings.TrimSpace(string(run.Stderr)))
	if run.Missing {
		detail = "tool not found: " + string(run.Stderr)
	}

	return Result{Name: name, Command: run.Command, Status: StatusFailedToRun, Detail: detail}
}
