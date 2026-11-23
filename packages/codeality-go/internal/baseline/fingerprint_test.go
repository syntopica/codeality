package baseline_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
)

func TestFingerprint(t *testing.T) {
	t.Parallel()

	base := baseline.Fingerprint("structure", "BGO001", "a.go", "Lease")

	// The value is frozen: changing it invalidates every recorded baseline.
	if base != "941e06306d9f1263" {
		t.Fatalf("Fingerprint = %s, which no longer matches recorded baselines", base)
	}

	others := []string{
		baseline.Fingerprint("lint", "BGO001", "a.go", "Lease"),
		baseline.Fingerprint("structure", "BGO002", "a.go", "Lease"),
		baseline.Fingerprint("structure", "BGO001", "b.go", "Lease"),
		baseline.Fingerprint("structure", "BGO001", "a.go", "Other"),
	}

	for _, other := range others {
		if other == base {
			t.Errorf("fingerprint %s does not depend on every part", other)
		}
	}
}
