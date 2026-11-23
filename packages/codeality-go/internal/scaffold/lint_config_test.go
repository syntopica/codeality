package scaffold

import (
	"os"
	"strings"
	"testing"
)

// The tool lints itself with the configuration it ships, plus its own
// local overrides: a rule the tool cannot live with must not be shipped.
func TestLintConfigIsTheOneTheToolUses(t *testing.T) {
	t.Parallel()

	own, err := os.ReadFile("../../.golangci.yml")
	if err != nil {
		t.Fatal(err)
	}

	if !strings.HasPrefix(string(own), lintConfig) {
		t.Error("the module's .golangci.yml no longer starts with the shipped assets/golangci.yml")
	}

	if !strings.HasSuffix(lintConfig, overridesMarker) {
		t.Error("the shipped configuration does not end at the local overrides marker")
	}
}
