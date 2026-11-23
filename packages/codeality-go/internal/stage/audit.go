package stage

import (
	"context"
	"strings"
)

// vulnerableExit is what govulncheck exits with, in text mode, when the
// module calls vulnerable code. Its JSON modes always exit 0.
const vulnerableExit = 3

// Audit runs govulncheck over the module.
func Audit() Stage {
	return Stage{Name: "audit", Run: runAudit}
}

func runAudit(ctx context.Context, env *Env) Result {
	const name = "audit"

	run := env.Run(ctx, env.Dir, "govulncheck", "./...")

	switch {
	case run.Missing:
		return failedToRun(name, &run)
	case run.ExitCode == 0:
		return Result{Name: name, Command: run.Command, Status: StatusPassed}
	case run.ExitCode != vulnerableExit:
		return failedToRun(name, &run)
	}

	result := Result{Name: name, Command: run.Command, Status: StatusFindings}

	for line := range strings.Lines(string(run.Stdout)) {
		if title, ok := strings.CutPrefix(strings.TrimSpace(line), "Vulnerability #"); ok {
			result.Items = append(result.Items, moduleItem("vulnerability", title))
		}
	}

	result.Detail = "run govulncheck ./... for the call stacks"

	return result
}
