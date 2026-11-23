package stage

import (
	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
)

// Env is what a stage works on.
type Env struct {
	// Dir is the module root.
	Dir    string
	Config *config.Config
	// Baseline is nil when the module records no debt.
	Baseline *baseline.File
	Run      Runner
}
