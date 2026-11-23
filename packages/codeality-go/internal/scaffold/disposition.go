package scaffold

// Disposition is what init would do to one path.
type Disposition string

// The dispositions of a planned file.
const (
	// Create: the file is absent and would be written.
	Create Disposition = "create"
	// Merge: the file exists and would gain a part, keeping the rest.
	Merge Disposition = "merge"
	// Conflict: the file differs from what init owns; only --force writes.
	Conflict Disposition = "conflict"
	// Unchanged: nothing to do.
	Unchanged Disposition = "unchanged"
)
