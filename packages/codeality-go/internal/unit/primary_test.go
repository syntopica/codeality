package unit_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/unit"
)

func TestPrimary(t *testing.T) {
	t.Parallel()

	cases := map[string]struct {
		source string
		stem   string
		want   string
	}{
		"name match wins":      {"func Other() {}\n\nfunc completeAttempt() {}\n", "complete_attempt", "completeAttempt"},
		"build suffix dropped": {"type Lease struct{}\n\nfunc helper() {}\n", "lease_linux", "Lease"},
		"only exported":        {"func Run() {}\n\nfunc helper() {}\n", "wrong", "Run"},
		"only unit":            {"func helper() {}\n", "wrong", "helper"},
		"value by any name":    {"const (\n\tfirst = 1\n\tsecond = 2\n)\n\nfunc a() {}\n", "second", "first"},
		"ambiguous":            {"func a() {}\n\nfunc b() {}\n", "wrong", ""},
		"two exported":         {"func A() {}\n\nfunc B() {}\n", "wrong", ""},
		"empty":                {"", "wrong", ""},
	}

	for name, test := range cases {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			got, ok := unit.Primary(extract(t, test.source), test.stem)
			if ok != (test.want != "") || (ok && got.Name() != test.want) {
				t.Errorf("Primary = %+v, %v; want %q", got, ok, test.want)
			}
		})
	}
}
