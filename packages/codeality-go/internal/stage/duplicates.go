package stage

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/jscpd"
)

const duplicatesName = "duplicates"

// Duplicates runs jscpd over the module.
func Duplicates() Stage {
	return Stage{Name: duplicatesName, Run: runDuplicates}
}

// jscpdSettings is the configuration file handed to jscpd.
type jscpdSettings struct {
	MinTokens int      `json:"minTokens"`
	Format    []string `json:"format"`
	Gitignore bool     `json:"gitignore"`
	Absolute  bool     `json:"absolute"`
	Ignore    []string `json:"ignore"`
	Reporters []string `json:"reporters"`
	Output    string   `json:"output"`
	Silent    bool     `json:"silent"`
}

// jscpdFile is one side of a clone in jscpd's report.
type jscpdFile struct {
	Name     string `json:"name"`
	StartLoc struct {
		Line   int `json:"line"`
		Column int `json:"column"`
	} `json:"startLoc"`
}

// jscpdReport is the part of jscpd's JSON report the stage reads. Its own
// "isNew" is ignored: new versus known comes only from the baseline.
type jscpdReport struct {
	Duplicates []struct {
		Lines      int       `json:"lines"`
		Fragment   string    `json:"fragment"`
		FirstFile  jscpdFile `json:"firstFile"`
		SecondFile jscpdFile `json:"secondFile"`
	} `json:"duplicates"`
	Statistics struct {
		Total struct {
			Percentage float64 `json:"percentage"`
		} `json:"total"`
	} `json:"statistics"`
}

func runDuplicates(ctx context.Context, env *Env) Result {
	result := Result{Name: duplicatesName, Status: StatusFailedToRun}

	work, err := os.MkdirTemp("", "codeality-go-jscpd-")
	if err != nil {
		result.Detail = err.Error()

		return result
	}

	defer func() { _ = os.RemoveAll(work) }()

	settings, err := json.Marshal(jscpdSettings{
		MinTokens: env.Config.Duplicates.MinTokens,
		Format:    []string{"go"},
		Gitignore: true,
		Absolute:  true,
		Ignore:    slices.Concat(jscpd.Ignore(), env.Config.Exclude),
		Reporters: []string{"json"},
		Output:    work,
		Silent:    true,
	})
	if err != nil {
		result.Detail = err.Error()

		return result
	}

	scratch, err := os.OpenRoot(work)
	if err != nil {
		result.Detail = err.Error()

		return result
	}

	defer func() { _ = scratch.Close() }()

	if err = scratch.WriteFile("jscpd.json", settings, filePermissions); err != nil {
		result.Detail = err.Error()

		return result
	}

	run := env.Run(ctx, env.Dir, "npx", "--yes", "jscpd@"+jscpd.Version,
		"--config", filepath.Join(work, "jscpd.json"), ".")

	raw, err := scratch.ReadFile("jscpd-report.json")
	if run.Missing || run.ExitCode != 0 || err != nil {
		return failedToRun(duplicatesName, &run)
	}

	var report jscpdReport
	if err = json.Unmarshal(raw, &report); err != nil {
		result.Command, result.Detail = run.Command, "unreadable jscpd report: "+err.Error()

		return result
	}

	return duplicatesResult(env, &run, &report)
}

// duplicatesResult turns a jscpd report into the result of the stage.
// With a recorded section the stage fails on new clones; without one, on
// the duplicated share passing the threshold.
func duplicatesResult(env *Env, run *ToolRun, report *jscpdReport) Result {
	result := Result{Name: duplicatesName, Command: run.Command}
	percentage := report.Statistics.Total.Percentage
	result.Detail = fmt.Sprintf("%.2f%% duplicated (threshold %.2f%%)", percentage, env.Config.Duplicates.Threshold)

	for _, clone := range report.Duplicates {
		first, second := inModule(env.Dir, clone.FirstFile.Name), inModule(env.Dir, clone.SecondFile.Name)
		paths := []string{first, second}
		slices.Sort(paths)

		result.Items = append(result.Items, Item{
			Code:    "duplicate",
			Message: fmt.Sprintf("%d lines duplicated with %s:%d", clone.Lines, second, clone.SecondFile.StartLoc.Line),
			Path:    first,
			Line:    clone.FirstFile.StartLoc.Line,
			Column:  clone.FirstFile.StartLoc.Column,
			Fingerprint: baseline.Fingerprint(duplicatesName, "duplicate",
				strings.Join(paths, "|"), strings.Join(strings.Fields(clone.Fragment), " ")),
		})
	}

	againstBaseline(&result, env.Baseline)

	if _, recorded := env.Baseline.Section(duplicatesName); !recorded {
		result.Status = StatusPassed
		if percentage > env.Config.Duplicates.Threshold {
			result.Status = StatusFindings
		}
	}

	return result
}

// inModule names an absolute path of jscpd's report relative to the module.
func inModule(dir, name string) string {
	root, err := filepath.Abs(dir)
	if err != nil {
		return name
	}

	for _, base := range []string{root, resolved(root)} {
		if relative, err := filepath.Rel(base, name); err == nil && filepath.IsLocal(relative) {
			return filepath.ToSlash(relative)
		}
	}

	return name
}

// resolved follows the symbolic links of path, which is how jscpd reports
// a module that sits under one.
func resolved(path string) string {
	if target, err := filepath.EvalSymlinks(path); err == nil {
		return target
	}

	return path
}
