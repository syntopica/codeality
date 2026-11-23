package glob_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
)

func TestMatch(t *testing.T) {
	t.Parallel()

	cases := []struct {
		pattern string
		name    string
		want    bool
	}{
		{"**/*.sql", "internal/store/schema.sql", true},
		{"**/*.sql", "schema.sql", true},
		{"internal/**", "internal/a/b/c.go", true},
		{"internal/**/errors.go", "internal/errors.go", true},
		{"internal/*/errors.go", "internal/a/b/errors.go", false},
		{"cmd/**", "internal/a.go", false},
		{"[", "a", false},
		{"a/b", "a", false},
	}

	for _, tc := range cases {
		t.Run(tc.pattern+" "+tc.name, func(t *testing.T) {
			t.Parallel()

			if got := glob.Match(tc.pattern, tc.name); got != tc.want {
				t.Errorf("Match(%q, %q) = %v, want %v", tc.pattern, tc.name, got, tc.want)
			}
		})
	}
}
