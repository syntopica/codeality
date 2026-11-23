package source

import (
	"go/ast"
	"go/token"
)

// File is one parsed Go source file of the module.
type File struct {
	// Path and Dir are relative to the module root, with forward slashes.
	Path string
	Dir  string
	// Stem is the file name without ".go".
	Stem string
	Role Role
	Src  []byte
	Fset *token.FileSet
	// Syntax is nil when the file could not be parsed at all.
	Syntax   *ast.File
	ParseErr error
}

// Position returns the 1-based line and column of pos.
func (f *File) Position(pos token.Pos) (line, column int) {
	position := f.Fset.Position(pos)

	return position.Line, position.Column
}

// PackageName returns the name in the package clause, or "" when the file
// did not parse that far.
func (f *File) PackageName() string {
	if f.Syntax == nil || f.Syntax.Name == nil {
		return ""
	}

	return f.Syntax.Name.Name
}
