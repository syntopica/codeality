package naming

import (
	"strings"
	"unicode"
)

// Snake converts a Go identifier to snake_case, keeping initialisms whole:
// "HTTPServer" is "http_server", "JobIDs" is "job_ids".
func Snake(name string) string {
	runes := []rune(name)

	var out strings.Builder

	for index, current := range runes {
		if index > 0 && startsWord(runes, index) {
			out.WriteByte('_')
		}

		out.WriteRune(unicode.ToLower(current))
	}

	return out.String()
}

// startsWord reports whether the upper-case rune at index opens a new word.
func startsWord(runes []rune, index int) bool {
	if !unicode.IsUpper(runes[index]) || runes[index-1] == '_' {
		return false
	}

	if !unicode.IsUpper(runes[index-1]) {
		return true
	}

	// Inside a run of capitals, the last one opens a word when lower case
	// follows ("HTTPServer"), unless that is only a plural "s" ("IDs").
	if index+1 >= len(runes) || !unicode.IsLower(runes[index+1]) {
		return false
	}

	pluralOnly := runes[index+1] == 's' && (index+2 == len(runes) || unicode.IsUpper(runes[index+2]))

	return !pluralOnly
}
