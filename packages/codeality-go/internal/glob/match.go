package glob

import (
	"path"
	"strings"
)

// Match reports whether name matches pattern. A "**" segment matches any
// number of directories, including none; every other segment follows
// [path.Match]. A malformed pattern matches nothing.
func Match(pattern, name string) bool {
	return matchSegments(strings.Split(pattern, "/"), strings.Split(name, "/"))
}

func matchSegments(pattern, name []string) bool {
	if len(pattern) == 0 {
		return len(name) == 0
	}

	if pattern[0] == "**" {
		for skip := 0; skip <= len(name); skip++ {
			if matchSegments(pattern[1:], name[skip:]) {
				return true
			}
		}

		return false
	}

	if len(name) == 0 {
		return false
	}

	matched, err := path.Match(pattern[0], name[0])
	if err != nil || !matched {
		return false
	}

	return matchSegments(pattern[1:], name[1:])
}
