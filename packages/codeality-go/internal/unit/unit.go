package unit

import (
	"go/ast"
	"go/token"
	"slices"
)

// Unit is one top-level declaration together with everything that belongs
// to it in the same file.
type Unit struct {
	// Names holds the declared name; a value unit lists every name of its
	// declaration.
	Names []string
	Kind  Kind
	Pos   token.Pos
}

// Name returns the first declared name.
func (u Unit) Name() string {
	return u.Names[0]
}

// Exported reports whether any declared name is visible outside the package.
func (u Unit) Exported() bool {
	return slices.ContainsFunc(u.Names, ast.IsExported)
}
