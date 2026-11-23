package exitcode

// Code is the exit code of a run.
type Code int

// The exit codes. A check that could not run is never reported as clean.
const (
	// Clean: everything ran and found nothing.
	Clean Code = iota
	// Findings: everything ran and something was found.
	Findings
	// Config: the configuration cannot be honoured, or init found a conflict.
	Config
	// Infrastructure: a tool is missing or crashed.
	Infrastructure
)
