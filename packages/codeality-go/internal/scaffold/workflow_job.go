package scaffold

import "go.yaml.in/yaml/v3"

// workflowJob returns the job id of the workflow text, decoded, and
// whether the workflow has it.
func workflowJob(text, id string) (any, bool) {
	var workflow struct {
		Jobs map[string]any `yaml:"jobs"`
	}

	if err := yaml.Unmarshal([]byte(text), &workflow); err != nil {
		return nil, false
	}

	job, found := workflow.Jobs[id]

	return job, found
}
