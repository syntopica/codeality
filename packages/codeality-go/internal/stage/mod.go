package stage

import (
	"bytes"
	"context"
)

// Mod checks that go.mod and go.sum are what the code needs, no more and
// no less, and that the downloaded modules are the ones they name.
func Mod() Stage {
	return Stage{Name: "mod", Run: runMod}
}

func runMod(ctx context.Context, env *Env) Result {
	const name = "mod"

	tidy := env.Run(ctx, env.Dir, "go", "mod", "tidy", "-diff")
	if tidy.Missing {
		return failedToRun(name, &tidy)
	}

	result := Result{Name: name, Command: tidy.Command + " && go mod verify", Status: StatusPassed}

	if tidy.ExitCode != 0 {
		if len(bytes.TrimSpace(tidy.Stdout)) == 0 {
			return failedToRun(name, &tidy)
		}

		result.Items = append(result.Items, moduleItem("mod-tidy", "go.mod or go.sum is not tidy; run go mod tidy"))
	}

	verify := env.Run(ctx, env.Dir, "go", "mod", "verify")
	if verify.ExitCode != 0 {
		result.Items = append(result.Items, moduleItem("mod-verify", "go mod verify failed: a dependency differs from go.sum"))
	}

	if len(result.Items) > 0 {
		result.Status = StatusFindings
	}

	return result
}
