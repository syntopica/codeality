package stage

// moduleItem is a finding about the module as a whole rather than a line.
func moduleItem(code, message string) Item {
	return Item{Code: code, Message: message, Path: "go.mod", Line: 1, Column: 1}
}
