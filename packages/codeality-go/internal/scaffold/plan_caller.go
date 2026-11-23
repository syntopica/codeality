package scaffold

import (
	"io/fs"
	"path"
	"strings"
)

const workflowsDir = ".github/workflows"

// planCaller plans what calls codeality.yml: a caller workflow when the
// repository has no CI, a note when it has one that does not call it, and
// nothing when something already does.
func planCaller(repository fs.FS) (PlannedFile, bool) {
	entries, _ := fs.ReadDir(repository, workflowsDir)

	others := 0

	for _, entry := range entries {
		name := entry.Name()
		if name == path.Base(workflowName) || (!strings.HasSuffix(name, ".yml") && !strings.HasSuffix(name, ".yaml")) {
			continue
		}

		others++

		if raw, err := fs.ReadFile(repository, path.Join(workflowsDir, name)); err == nil &&
			strings.Contains(string(raw), path.Base(workflowName)) {
			return PlannedFile{}, false
		}
	}

	if others == 0 {
		return PlannedFile{
			Path: path.Join(workflowsDir, "quality.yml"), Disposition: Create, Content: callerWorkflow,
			Detail: "no CI workflow; calls codeality.yml on push and pull_request",
		}, true
	}

	return PlannedFile{
		Path: workflowsDir, Disposition: Unchanged,
		Detail: "nothing calls codeality.yml yet; add a job to your CI with `uses: ./" + workflowName + "`",
	}, true
}
