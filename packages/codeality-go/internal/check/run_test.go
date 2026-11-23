package check_test

import (
	"os"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/check"
	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// The tool is held to its own rules.
func TestRunOwnModuleIsClean(t *testing.T) {
	t.Parallel()

	const root = "../.."

	cfg, err := config.Load(root)
	if err != nil {
		t.Fatal(err)
	}

	module, err := source.Load(os.DirFS(root), cfg)
	if err != nil {
		t.Fatal(err)
	}

	findings := check.Run(module, cfg)
	for index := range findings {
		t.Error(findings[index].String())
	}
}
