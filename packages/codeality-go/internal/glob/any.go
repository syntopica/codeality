package glob

import "slices"

// Any reports whether name matches at least one of the patterns.
func Any(patterns []string, name string) bool {
	return slices.ContainsFunc(patterns, func(pattern string) bool {
		return Match(pattern, name)
	})
}
