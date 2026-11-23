package cli

import (
	"flag"
	"fmt"
	"os"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/scaffold"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// runInit is "init": it prints what it would do, and does it under
// --apply. A file that differs from what init owns is never replaced
// without --force.
func runInit(app *App, args []string) exitcode.Code {
	set := flag.NewFlagSet("init", flag.ContinueOnError)
	set.SetOutput(app.Stderr)

	checkOnly := set.Bool("check", false, "fail when a file differs from what init would write")
	apply := set.Bool("apply", false, "write the files")
	force := set.Bool("force", false, "with --apply, also replace the files that differ")
	withCI := set.Bool("ci", false, "also plan the module's job in .github/workflows/codeality.yml")

	if _, err := parseFlags(set, args); err != nil {
		return exitcode.Config
	}

	if _, err := source.ModulePath(os.DirFS(app.Dir)); err != nil {
		return app.refuse(err, exitcode.Config)
	}

	plan, err := scaffold.NewPlan(app.Dir, *withCI)
	if err != nil {
		return app.refuse(err, exitcode.Infrastructure)
	}

	for index := range plan.Files {
		planned := &plan.Files[index]
		app.print(fmt.Sprintf("%-9s %s (%s)\n", planned.Disposition, planned.Path, planned.Detail))
	}

	conflicts := plan.Conflicts()

	if *apply && !*checkOnly {
		written, applyErr := plan.Apply(*force)
		if applyErr != nil {
			return app.refuse(applyErr, exitcode.Infrastructure)
		}

		app.print(fmt.Sprintf("wrote %d files\n", len(written)))

		if *force {
			conflicts = 0
		}
	}

	if conflicts > 0 {
		return exitcode.Config
	}

	return exitcode.Clean
}
