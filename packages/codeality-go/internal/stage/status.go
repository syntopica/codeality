package stage

// Status is how a stage ended.
type Status string

// The ways a stage ends. A stage that could not run is never a skip: a
// gate that did not run a check must not look like one that passed it.
const (
	StatusPassed      Status = "passed"
	StatusFindings    Status = "findings"
	StatusFailedToRun Status = "failedToRun"
)
