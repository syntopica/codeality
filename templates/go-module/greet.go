package greeting

import "strings"

// Greet returns a greeting for name, or for the world when there is none.
func Greet(name string) string {
	if name = strings.TrimSpace(name); name == "" {
		name = "world"
	}

	return "Hello, " + name + "!"
}
