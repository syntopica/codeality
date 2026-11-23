package syntax_test

import (
	"go/ast"
	"go/parser"
	"go/token"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/syntax"
)

func TestReceiverName(t *testing.T) {
	t.Parallel()

	const source = `package p

func (l *Lease[T]) Expired() bool { return false }

func Plain() {}
`

	file, err := parser.ParseFile(token.NewFileSet(), "p.go", source, parser.SkipObjectResolution)
	if err != nil {
		t.Fatal(err)
	}

	want := []string{"Lease", ""}

	for index, decl := range file.Decls {
		fn, ok := decl.(*ast.FuncDecl)
		if !ok {
			t.Fatalf("declaration %d is not a function", index)
		}

		if got := syntax.ReceiverName(fn); got != want[index] {
			t.Errorf("ReceiverName(%s) = %q, want %q", fn.Name.Name, got, want[index])
		}
	}
}
