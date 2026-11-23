package stage

import (
	"context"
	"os"

	"github.com/syntopica/codeality/packages/codeality-go/internal/check"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// Structure runs the BGO rules.
func Structure() Stage {
	return Stage{Name: check.Section, Run: runStructure}
}

func runStructure(_ context.Context, env *Env) Result {
	result := Result{Name: check.Section, Command: "codeality-go check"}

	module, err := source.Load(os.DirFS(env.Dir), env.Config)
	if err != nil {
		result.Status = StatusFailedToRun
		result.Detail = err.Error()

		return result
	}

	findings := check.Run(module, env.Config)
	for index := range findings {
		found := &findings[index]
		result.Items = append(result.Items, Item{
			Code:        found.Code,
			Message:     found.Rule + ": " + found.Message,
			Path:        found.Path,
			Line:        found.Line,
			Column:      found.Column,
			Fingerprint: found.Fingerprint,
		})
	}

	againstBaseline(&result, env.Baseline)

	return result
}
