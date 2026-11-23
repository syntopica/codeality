package config

// InvalidError reports a configuration file that cannot be used. Commands
// map it to exit code 2.
type InvalidError struct {
	Reason string
}

// Error implements error.
func (e *InvalidError) Error() string {
	return FileName + ": " + e.Reason
}
