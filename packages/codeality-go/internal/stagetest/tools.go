package stagetest

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

const (
	cleanLint   = `{"Issues":[]}`
	cleanReport = `{"duplicates":[],"statistics":{"total":{"percentage":0}}}`
	permissions = 0o600
)

// Tools is a set of fake tools. Its Run method is a [stage.Runner].
type Tools struct {
	// Runs maps the start of a command line, such as "go mod tidy", to
	// what running it produces. A command with no entry exits cleanly.
	Runs map[string]stage.ToolRun
	// Report is the report jscpd writes; empty means it found nothing.
	Report string
	// Profile is the cover profile go test writes; empty means none.
	Profile string
}

// Run answers as the tool named by name and args would.
func (t *Tools) Run(_ context.Context, _, name string, args ...string) stage.ToolRun {
	command := strings.Join(append([]string{name}, args...), " ")

	for index, arg := range args {
		switch {
		case arg == "--config" && name == "npx":
			write(filepath.Join(filepath.Dir(args[index+1]), "jscpd-report.json"), t.Report, cleanReport)
		case strings.HasPrefix(arg, "-coverprofile="):
			write(strings.TrimPrefix(arg, "-coverprofile="), t.Profile, "mode: atomic\n")
		}
	}

	for start, run := range t.Runs {
		if strings.HasPrefix(command, start) {
			run.Command = command

			return run
		}
	}

	run := stage.ToolRun{Command: command}
	if strings.HasPrefix(command, "golangci-lint run") {
		run.Stdout = []byte(cleanLint)
	}

	return run
}

// write stores content, or fallback when there is none, as the file a
// tool would have left behind.
func write(name, content, fallback string) {
	if content == "" {
		content = fallback
	}

	// A file that could not be written shows up as the stage failing to
	// read it, which is the failure the test would want to see.
	_ = os.WriteFile(name, []byte(content), permissions)
}
