package gate

import (
	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

// ExitCode judges a run: a stage that could not run outranks findings,
// because its findings are unknown.
func ExitCode(results []stage.Result) exitcode.Code {
	code := exitcode.Clean

	for index := range results {
		switch results[index].Status {
		case stage.StatusFailedToRun:
			return exitcode.Infrastructure
		case stage.StatusFindings:
			code = exitcode.Findings
		case stage.StatusPassed:
		}
	}

	return code
}
