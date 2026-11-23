package syntax_test

import (
	"go/parser"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/syntax"
)

func TestTypeName(t *testing.T) {
	t.Parallel()

	cases := map[string]string{
		"Lease":           "Lease",
		"*Lease":          "Lease",
		"(*Lease)":        "Lease",
		"Queue[T]":        "Queue",
		"*Pair[K, V]":     "Pair",
		"time.Duration":   "",
		"[]Lease":         "",
		"map[string]bool": "",
	}

	for source, want := range cases {
		t.Run(source, func(t *testing.T) {
			t.Parallel()

			expr, err := parser.ParseExpr(source)
			if err != nil {
				t.Fatal(err)
			}

			if got := syntax.TypeName(expr); got != want {
				t.Errorf("TypeName(%s) = %q, want %q", source, got, want)
			}
		})
	}
}
