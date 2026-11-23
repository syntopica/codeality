package stage

// ToolRun is what running an external tool produced.
type ToolRun struct {
	// Command is the command line, for the report.
	Command  string
	ExitCode int
	Stdout   []byte
	Stderr   []byte
	// Missing reports that the tool could not be started at all.
	Missing bool
}
