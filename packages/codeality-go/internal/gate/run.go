package gate

import (
	"context"
	"time"

	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

// Run runs stages in order, timing each. Every stage runs unless failFast,
// which stops at the first one that did not pass.
func Run(ctx context.Context, stages []stage.Stage, env *stage.Env, failFast bool) []stage.Result {
	results := make([]stage.Result, 0, len(stages))

	for _, current := range stages {
		started := time.Now()
		result := current.Run(ctx, env)
		result.Seconds = time.Since(started).Seconds()
		results = append(results, result)

		if failFast && result.Status != stage.StatusPassed {
			break
		}
	}

	return results
}
