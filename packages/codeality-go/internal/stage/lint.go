package stage

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
)

// Lint runs golangci-lint with the module's configuration.
func Lint() Stage {
	return Stage{Name: "lint", Run: runLint}
}

// lintReport is the part of golangci-lint's JSON output the stage reads.
type lintReport struct {
	Issues []struct {
		FromLinter  string   `json:"FromLinter"`
		Text        string   `json:"Text"`
		SourceLines []string `json:"SourceLines"`
		Pos         struct {
			Filename string `json:"Filename"`
			Line     int    `json:"Line"`
			Column   int    `json:"Column"`
		} `json:"Pos"`
	} `json:"Issues"`
}

func runLint(ctx context.Context, env *Env) Result {
	const name = "lint"

	run := env.Run(ctx, env.Dir, "golangci-lint", "run",
		"--output.json.path", "stdout", "--output.text.path", "stderr", "--show-stats=false")

	var report lintReport

	// golangci-lint exits 1 when it has issues to report; anything else,
	// or output that is not its report, means it did not lint.
	if run.Missing || run.ExitCode > 1 || json.Unmarshal(run.Stdout, &report) != nil {
		return failedToRun(name, &run)
	}

	result := Result{Name: name, Command: run.Command}

	for _, issue := range report.Issues {
		where := issue.Text
		if len(issue.SourceLines) > 0 {
			where = strings.Join(strings.Fields(issue.SourceLines[0]), " ")
		}

		result.Items = append(result.Items, Item{
			Code:        issue.FromLinter,
			Message:     issue.Text,
			Path:        issue.Pos.Filename,
			Line:        issue.Pos.Line,
			Column:      issue.Pos.Column,
			Fingerprint: baseline.Fingerprint(name, issue.FromLinter, issue.Pos.Filename, where),
		})
	}

	againstBaseline(&result, env.Baseline)

	return result
}
