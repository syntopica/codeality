package scaffold

import "os"

// readText returns the content of name under root and whether it exists.
func readText(root *os.Root, name string) (string, bool) {
	raw, err := root.ReadFile(name)
	if err != nil {
		return "", false
	}

	return string(raw), true
}
