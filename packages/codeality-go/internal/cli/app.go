package cli

import (
	"context"
	"fmt"
	"io"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
	"github.com/syntopica/codeality/packages/codeality-go/internal/version"
)

// App is one invocation of the tool: where it runs and what it talks to.
type App struct {
	// Dir is the module root.
	Dir string
	// Stdout takes the report, Stderr everything else.
	Stdout io.Writer
	Stderr io.Writer
	// Runner starts the tools of the gate.
	Runner stage.Runner
}

// Main runs the command named by args and returns its exit code.
func (a *App) Main(ctx context.Context, args []string) exitcode.Code {
	if len(args) == 0 {
		a.fail(usage)

		return exitcode.Config
	}

	switch command, rest := args[0], args[1:]; command {
	case checkCommand:
		return runCheck(a, rest)
	case "gate":
		return runGate(ctx, a, rest)
	case "baseline":
		return runBaseline(ctx, a, rest)
	case "init":
		return runInit(a, rest)
	case "version", "--version":
		a.print(version.Number + "\n")

		return exitcode.Clean
	case "help", "--help", "-h":
		a.print(usage)

		return exitcode.Clean
	default:
		a.fail(fmt.Sprintf("unknown command %q\n\n%s", command, usage))

		return exitcode.Config
	}
}

// print writes a report. A reader that went away is not this tool's
// failure to report.
func (a *App) print(text string) {
	_, _ = io.WriteString(a.Stdout, text)
}

// fail writes a message for the person running the tool.
func (a *App) fail(text string) {
	_, _ = io.WriteString(a.Stderr, "codeality-go: "+text)
}

// refuse reports an error that stops the run and returns the code for it.
func (a *App) refuse(err error, code exitcode.Code) exitcode.Code {
	a.fail(err.Error() + "\n")

	return code
}
