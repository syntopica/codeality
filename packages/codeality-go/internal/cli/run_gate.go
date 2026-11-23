package cli

import (
	"context"
	"flag"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/gate"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

// runGate is "gate": every stage, in order.
func runGate(ctx context.Context, app *App, args []string) exitcode.Code {
	set := flag.NewFlagSet("gate", flag.ContinueOnError)
	set.SetOutput(app.Stderr)

	failFast := set.Bool("fail-fast", false, "stop at the first stage that does not pass")
	asJSON := set.Bool("json", false, "report as JSON")

	if _, err := parseFlags(set, args); err != nil {
		return exitcode.Config
	}

	env, err := loadEnv(app)
	if err != nil {
		return app.refuse(err, exitcode.Config)
	}

	results := gate.Run(ctx, stage.All(), env, *failFast)
	code := gate.ExitCode(results)

	text := report.GateText(results, code)
	if *asJSON {
		if text, err = report.GateJSON(results, code); err != nil {
			return app.refuse(err, exitcode.Infrastructure)
		}
	}

	app.print(text)

	return code
}
