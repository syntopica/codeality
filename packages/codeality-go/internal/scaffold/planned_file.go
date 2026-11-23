package scaffold

// PlannedFile is a path init would create, merge into, or leave alone.
type PlannedFile struct {
	// Path is relative to the root of the plan, with forward slashes.
	Path        string
	Disposition Disposition
	Detail      string
	// Content is what apply writes; for a conflict, what --force writes.
	// It is empty when there is nothing to write.
	Content string
}
