package glob_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
)

func TestAny(t *testing.T) {
	t.Parallel()

	patterns := []string{"vendor/**", "**/*_gen.go"}

	if !glob.Any(patterns, "internal/api/routes_gen.go") {
		t.Error("Any did not match the second pattern")
	}

	if glob.Any(patterns, "internal/api/routes.go") {
		t.Error("Any matched a path no pattern covers")
	}

	if glob.Any(nil, "a.go") {
		t.Error("Any matched with no patterns")
	}
}
