package cli

import (
	"errors"
	"flag"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/check"
	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/finding"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

const (
	formatText = "text"
	formatJSON = "json"
)

var errFormat = errors.New("--format must be text or json")

// runCheck is "check": the structural rules over the module, or over the
// paths given. Any finding fails it; the baseline only labels them.
func runCheck(app *App, args []string) exitcode.Code {
	paths, format, failFast, err := checkFlags(app, args)
	if err != nil {
		return app.refuse(err, exitcode.Config)
	}

	env, err := loadEnv(app)
	if err != nil {
		return app.refuse(err, exitcode.Config)
	}

	module, err := source.Load(os.DirFS(app.Dir), env.Config)
	if err != nil {
		return app.refuse(err, exitcode.Config)
	}

	findings := under(check.Run(module, env.Config), paths)
	if failFast && len(findings) > 1 {
		findings = findings[:1]
	}

	check.Classify(findings, env.Baseline)

	text := report.CheckText(findings)
	if format == formatJSON {
		text, err = report.CheckJSON(roots(paths), len(module.Files), findings)
	}

	if err != nil {
		return app.refuse(err, exitcode.Infrastructure)
	}

	app.print(text)

	if len(findings) > 0 {
		return exitcode.Findings
	}

	return exitcode.Clean
}

// checkFlags parses the arguments of "check".
func checkFlags(app *App, args []string) (paths []string, format string, failFast bool, err error) {
	set := flag.NewFlagSet(checkCommand, flag.ContinueOnError)
	set.SetOutput(app.Stderr)
	set.StringVar(&format, "format", formatText, "text or json")
	set.BoolVar(&failFast, "fail-fast", false, "report only the first finding")

	if paths, err = parseFlags(set, args); err != nil {
		return nil, "", false, err
	}

	if format != formatText && format != formatJSON {
		return nil, "", false, errFormat
	}

	return paths, format, failFast, nil
}

// roots names what was checked: the paths given, or the module.
func roots(paths []string) []string {
	if len(paths) == 0 {
		return []string{"."}
	}

	return paths
}

// under keeps the findings in or below one of paths, which are relative
// to the module root. No paths keeps them all.
func under(findings []finding.Finding, paths []string) []finding.Finding {
	if len(paths) == 0 {
		return findings
	}

	var kept []finding.Finding

	for index := range findings {
		for _, given := range paths {
			root := path.Clean(filepath.ToSlash(given))
			if root == "." || findings[index].Path == root || strings.HasPrefix(findings[index].Path, root+"/") {
				kept = append(kept, findings[index])

				break
			}
		}
	}

	return kept
}
