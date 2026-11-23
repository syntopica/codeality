package naming

import (
	"slices"
	"strings"
)

// UnitStem removes from a file stem what the go command reads as a build
// constraint or a test marker, leaving the part that names the unit:
// "lease_linux_amd64" and "lease_test" are both "lease".
func UnitStem(stem string) string {
	stem = strings.TrimSuffix(stem, "_test")
	parts := strings.Split(stem, "_")

	if len(parts) > 1 && slices.Contains(knownArch(), parts[len(parts)-1]) {
		parts = parts[:len(parts)-1]
	}

	if len(parts) > 1 && slices.Contains(knownOS(), parts[len(parts)-1]) {
		parts = parts[:len(parts)-1]
	}

	return strings.Join(parts, "_")
}

// knownOS lists the GOOS values the go command accepts as a file suffix.
func knownOS() []string {
	return []string{
		"aix", "android", "darwin", "dragonfly", "freebsd", "illumos", "ios", "js", "linux",
		"netbsd", "openbsd", "plan9", "solaris", "wasip1", "windows",
	}
}

// knownArch lists the GOARCH values the go command accepts as a file suffix.
func knownArch() []string {
	return []string{
		"386", "amd64", "arm", "arm64", "loong64", "mips", "mips64", "mips64le", "mipsle",
		"ppc64", "ppc64le", "riscv64", "s390x", "wasm",
	}
}
