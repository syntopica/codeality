package cli

import (
	"fmt"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

// loadEnv reads the configuration and the baseline of the module the app
// runs in.
func loadEnv(app *App) (*stage.Env, error) {
	cfg, err := config.Load(app.Dir)
	if err != nil {
		return nil, fmt.Errorf("load configuration: %w", err)
	}

	recorded, _, err := baseline.Read(app.Dir)
	if err != nil {
		return nil, fmt.Errorf("load baseline: %w", err)
	}

	return &stage.Env{Dir: app.Dir, Config: cfg, Baseline: recorded, Run: app.Runner}, nil
}
