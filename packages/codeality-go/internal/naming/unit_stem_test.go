package naming_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/naming"
)

func TestUnitStem(t *testing.T) {
	t.Parallel()

	cases := map[string]string{
		"lease":                  "lease",
		"lease_test":             "lease",
		"lease_linux":            "lease",
		"lease_amd64":            "lease",
		"lease_linux_amd64":      "lease",
		"lease_linux_amd64_test": "lease",
		"host_state_darwin":      "host_state",
		"linux":                  "linux",
		"complete_attempt":       "complete_attempt",
	}

	for stem, want := range cases {
		t.Run(stem, func(t *testing.T) {
			t.Parallel()

			if got := naming.UnitStem(stem); got != want {
				t.Errorf("UnitStem(%q) = %q, want %q", stem, got, want)
			}
		})
	}
}
