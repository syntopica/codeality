package cli

import (
	"context"
	"errors"
	"fmt"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/gate"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
	"github.com/syntopica/codeality/packages/codeality-go/internal/version"
)

var (
	errBaselineUsage   = errors.New("usage: codeality-go baseline create|update|check")
	errBaselineExists  = errors.New(baseline.FileName + " already exists; use baseline update")
	errBaselineMissing = errors.New("no " + baseline.FileName + "; run baseline create")
)

// runBaseline is "baseline": check compares the baselined stages with the
// recorded debt, create and update record what they find now.
func runBaseline(ctx context.Context, app *App, args []string) exitcode.Code {
	if len(args) != 1 {
		return app.refuse(errBaselineUsage, exitcode.Config)
	}

	env, err := loadEnv(app)
	if err != nil {
		return app.refuse(err, exitcode.Config)
	}

	switch action := args[0]; {
	case action == checkCommand && env.Baseline == nil:
		return app.refuse(errBaselineMissing, exitcode.Config)
	case action == checkCommand:
		results := gate.Run(ctx, stage.Baselined(), env, false)
		code := gate.ExitCode(results)
		app.print(report.GateText(results, code))

		return code
	case action == "create" && env.Baseline != nil:
		return app.refuse(errBaselineExists, exitcode.Config)
	case action == "create", action == "update":
		return record(ctx, app, env)
	default:
		return app.refuse(errBaselineUsage, exitcode.Config)
	}
}

// record writes what the baselined stages find now as the module's debt.
// A stage that could not run records nothing: an empty section would
// forgive debt nobody looked at.
func record(ctx context.Context, app *App, env *stage.Env) exitcode.Code {
	env.Baseline = nil

	results := gate.Run(ctx, stage.Baselined(), env, false)
	if code := gate.ExitCode(results); code == exitcode.Infrastructure {
		app.print(report.GateText(results, code))

		return code
	}

	recorded := baseline.New(version.Number)

	for index := range results {
		fingerprints := make([]string, len(results[index].Items))
		for item := range results[index].Items {
			fingerprints[item] = results[index].Items[item].Fingerprint
		}

		recorded.Record(results[index].Name, fingerprints)
		app.print(fmt.Sprintf("%-10s %d recorded\n", results[index].Name, len(fingerprints)))
	}

	if err := baseline.Write(app.Dir, recorded); err != nil {
		return app.refuse(err, exitcode.Infrastructure)
	}

	return exitcode.Clean
}
