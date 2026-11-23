package greeting_test

import (
	"testing"

	"example.com/greeting"
)

func TestGreet(t *testing.T) {
	t.Parallel()

	for _, test := range []struct{ name, want string }{
		{name: "Ada", want: "Hello, Ada!"},
		{name: " Go ", want: "Hello, Go!"},
		{name: "", want: "Hello, world!"},
	} {
		if got := greeting.Greet(test.name); got != test.want {
			t.Errorf("Greet(%q) = %q, want %q", test.name, got, test.want)
		}
	}
}
