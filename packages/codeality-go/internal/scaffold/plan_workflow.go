package scaffold

import (
	"os"
	"reflect"
)

// planWorkflow plans the module's job in the repository's codeality.yml,
// leaving every other job byte-identical.
func planWorkflow(root *os.Root, workingDirectory string) PlannedFile {
	id, job := jobID(workingDirectory), renderJob(workingDirectory)

	text, found := readText(root, workflowName)
	if !found {
		return created(workflowName, workflowHeader+job)
	}

	existing, hasJob := workflowJob(text, id)
	if !hasJob {
		return PlannedFile{Path: workflowName, Disposition: Merge, Detail: "add job " + id, Content: insertJob(text, job)}
	}

	if expected, _ := workflowJob("jobs:\n"+job, id); reflect.DeepEqual(existing, expected) {
		return PlannedFile{Path: workflowName, Disposition: Unchanged, Detail: "job " + id + " current"}
	}

	return PlannedFile{
		Path: workflowName, Disposition: Conflict, Content: insertJob(removeJob(text, id), job),
		Detail: "job " + id + " was edited; use --force to replace it",
	}
}
