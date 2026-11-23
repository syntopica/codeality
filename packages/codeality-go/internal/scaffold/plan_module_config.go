package scaffold

import "os"

// planModuleConfig plans codeality-go.yaml, which is the module's own:
// written once, never replaced.
func planModuleConfig(root *os.Root, name string) PlannedFile {
	if _, found := readText(root, name); found {
		return PlannedFile{Path: name, Disposition: Unchanged, Detail: "module-owned; never replaced"}
	}

	return created(name, moduleConfig)
}
