package scaffold

// created plans a file that does not exist yet.
func created(name, content string) PlannedFile {
	return PlannedFile{Path: name, Disposition: Create, Detail: "not present", Content: content}
}
