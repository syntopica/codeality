package report

import (
	"fmt"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

// GateText renders a gate run: one line per stage, the findings that are
// not already recorded debt under it, and the verdict.
func GateText(results []stage.Result, code exitcode.Code) string {
	var text strings.Builder

	for index := range results {
		result := &results[index]
		fmt.Fprintf(&text, "%-9s %s (%.1fs) %s\n", statusLabel(result.Status), result.Name, result.Seconds, result.Command)

		for line := range strings.Lines(result.Detail) {
			text.WriteString("  " + strings.TrimRight(line, "\n") + "\n")
		}

		if result.Known+result.Resolved > 0 {
			fmt.Fprintf(&text, "  %d new, %d known, %d resolved\n", result.New, result.Known, result.Resolved)
		}

		for _, item := range result.Items {
			if item.BaselineState != string(baseline.StateKnown) {
				fmt.Fprintf(&text, "  %s:%d:%d: %s: %s\n", item.Path, item.Line, item.Column, item.Code, item.Message)
			}
		}
	}

	fmt.Fprintf(&text, "gate: %s (exit %d)\n", verdict(code), code)

	return text.String()
}

func statusLabel(status stage.Status) string {
	if status == stage.StatusFailedToRun {
		return "failed"
	}

	return string(status)
}

func verdict(code exitcode.Code) string {
	switch code {
	case exitcode.Clean:
		return "passed"
	case exitcode.Findings:
		return "findings"
	case exitcode.Config, exitcode.Infrastructure:
	}

	return "failed to run"
}
