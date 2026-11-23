package unit

// Kind is what a unit declares.
type Kind string

// The kinds of unit.
const (
	KindType     Kind = "type"
	KindFunction Kind = "function"
	KindValue    Kind = "value"
)
