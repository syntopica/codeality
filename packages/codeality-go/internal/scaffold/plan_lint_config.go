package scaffold

import (
	"os"
	"strings"
)

// planLintConfig plans .golangci.yml. Init owns the file down to the
// "local overrides" marker and never touches what follows it.
func planLintConfig(root *os.Root, name string) PlannedFile {
	existing, found := readText(root, name)
	if !found {
		return created(name, lintConfig)
	}

	head, overrides, marked := strings.Cut(existing, overridesMarker)
	if marked && head+overridesMarker == lintConfig {
		return PlannedFile{Path: name, Disposition: Unchanged, Detail: "current"}
	}

	if !marked {
		return PlannedFile{
			Path: name, Disposition: Conflict, Content: lintConfig,
			Detail: "differs and has no local overrides block; use --force to replace it",
		}
	}

	return PlannedFile{
		Path: name, Disposition: Conflict, Content: lintConfig + overrides,
		Detail: "differs; use --force to replace it (local overrides are kept)",
	}
}
