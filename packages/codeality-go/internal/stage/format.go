package stage

import (
	"context"
	"strings"
)

const formatName = "format"

// Format checks that every file is formatted as gofumpt and gci leave it.
func Format() Stage {
	return Stage{Name: formatName, Run: runFormat}
}

func runFormat(ctx context.Context, env *Env) Result {
	run := env.Run(ctx, env.Dir, "golangci-lint", "fmt", "--diff")

	// A diff is a finding whatever the exit code; no diff and a failure is
	// a tool that did not run.
	items := diffItems(string(run.Stdout))
	if len(items) == 0 && (run.Missing || run.ExitCode != 0) {
		return failedToRun(formatName, &run)
	}

	result := Result{Name: formatName, Command: run.Command, Status: StatusPassed, Items: items}
	if len(items) > 0 {
		result.Status = StatusFindings
		result.Detail = "run golangci-lint fmt"
	}

	return result
}

// diffItems returns one item per file of a unified diff.
func diffItems(diff string) []Item {
	var items []Item

	for line := range strings.Lines(diff) {
		name, isHeader := strings.CutPrefix(strings.TrimSpace(line), "+++ ")
		if !isHeader {
			continue
		}

		name = strings.TrimPrefix(name, "b/")
		items = append(items, Item{Code: formatName, Message: "file is not formatted", Path: name, Line: 1, Column: 1})
	}

	return items
}
