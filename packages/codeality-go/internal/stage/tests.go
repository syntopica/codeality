package stage

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

const (
	testsName   = "test"
	outputLines = 20
	percent     = 100
)

// Tests runs the test suite with the race detector, in shuffled order,
// and holds the module to its coverage floor and its time budget.
func Tests() Stage {
	return Stage{Name: testsName, Run: runTests}
}

func runTests(ctx context.Context, env *Env) Result {
	result := Result{Name: testsName, Status: StatusFailedToRun}

	work, err := os.MkdirTemp("", "codeality-go-cover-")
	if err != nil {
		result.Detail = err.Error()

		return result
	}

	defer func() { _ = os.RemoveAll(work) }()

	profile := filepath.Join(work, "cover.out")

	// -coverpkg counts a statement as covered whichever package's tests
	// ran it, so a helper package tested through its users is not at zero.
	args := []string{"test", "-shuffle=on", "-coverpkg=./...", "-coverprofile=" + profile, "./..."}
	if env.Config.Race {
		args = slices.Insert(args, 1, "-race")
	}

	started := time.Now()
	run := env.Run(ctx, env.Dir, "go", args...)
	elapsed := time.Since(started)

	output := string(run.Stdout) + string(run.Stderr)
	if run.Missing || strings.Contains(output, "-race requires cgo") || strings.Contains(output, "-race is not supported") {
		return failedToRun(testsName, &run)
	}

	raw, _ := fs.ReadFile(os.DirFS(work), "cover.out")
	modulePath, _ := source.ModulePath(os.DirFS(env.Dir))

	result.Command, result.Status = run.Command, StatusPassed
	result.Detail, result.Items = testFindings(env, &run, coverage(string(raw), modulePath, env.Config.CoverageExclude), elapsed)

	if len(result.Items) > 0 {
		result.Status = StatusFindings
	}

	return result
}

// testFindings judges a run of the suite: failing tests, then the
// coverage floor, then the time budget.
func testFindings(env *Env, run *ToolRun, covered float64, elapsed time.Duration) (detail string, items []Item) {
	floor := env.Config.CoverageThreshold

	switch {
	case run.ExitCode != 0:
		detail = lastLines(string(run.Stdout)+string(run.Stderr), outputLines)
		items = append(items, moduleItem("test-failure", "go test failed"))
	case covered < floor:
		items = append(items, moduleItem("coverage", fmt.Sprintf("coverage %.1f%% is under the floor of %.1f%%", covered, floor)))
	default:
		detail = fmt.Sprintf("coverage %.1f%% (floor %.1f%%)", covered, floor)
	}

	if budget := time.Duration(env.Config.TestBudgetSeconds) * time.Second; budget > 0 && elapsed > budget {
		items = append(items, moduleItem("test-budget",
			fmt.Sprintf("the suite took %.0fs, over its budget of %ds", elapsed.Seconds(), env.Config.TestBudgetSeconds)))
	}

	return detail, items
}

// lastLines returns the last count lines of text.
func lastLines(text string, count int) string {
	lines := strings.Split(strings.TrimSpace(text), "\n")
	if len(lines) > count {
		lines = lines[len(lines)-count:]
	}

	return strings.Join(lines, "\n")
}

// coverage returns the share of statements a cover profile says ran, in
// percent, leaving out the files that match exclude. go test's own total
// cannot leave files out, so the floor is computed here. A profile with no
// statements counts as fully covered: there is nothing to cover.
func coverage(profile, modulePath string, exclude []string) float64 {
	// A block appears once per test binary that saw it.
	statements, ran := make(map[string]int), make(map[string]bool)

	for line := range strings.Lines(profile) {
		// <import path>/<file>:<start>,<end> <statements> <count>
		fields := strings.Fields(line)
		if len(fields) != 3 || !strings.Contains(fields[0], ":") {
			continue
		}

		file := strings.TrimPrefix(fields[0][:strings.LastIndex(fields[0], ":")], modulePath+"/")
		if glob.Any(exclude, file) {
			continue
		}

		count, _ := strconv.Atoi(fields[1])
		statements[fields[0]] = count
		ran[fields[0]] = ran[fields[0]] || fields[2] != "0"
	}

	total, hit := 0, 0
	for block, count := range statements {
		total += count
		if ran[block] {
			hit += count
		}
	}

	if total == 0 {
		return percent
	}

	return percent * float64(hit) / float64(total)
}
