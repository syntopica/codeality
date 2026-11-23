package stage

import (
	"bytes"
	"context"
	"errors"
	"os/exec"
	"strings"
)

// Execute is the [Runner] that really starts the tool.
func Execute(ctx context.Context, dir, name string, args ...string) ToolRun {
	run := ToolRun{Command: strings.Join(append([]string{name}, args...), " ")}

	var stdout, stderr bytes.Buffer

	command := exec.CommandContext(ctx, name, args...)
	command.Dir = dir
	command.Stdout = &stdout
	command.Stderr = &stderr

	err := command.Run()
	run.Stdout, run.Stderr = stdout.Bytes(), stderr.Bytes()

	if exit, ok := errors.AsType[*exec.ExitError](err); ok {
		run.ExitCode = exit.ExitCode()

		return run
	}

	if err != nil {
		run.Missing = true
		run.Stderr = []byte(err.Error())
	}

	return run
}
