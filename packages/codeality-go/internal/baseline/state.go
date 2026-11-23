package baseline

// State is where a finding stands against the recorded debt.
type State string

// The states of a finding.
const (
	StateNew   State = "new"
	StateKnown State = "known"
)
