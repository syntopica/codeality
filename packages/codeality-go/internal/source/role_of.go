package source

import (
	"go/ast"
	"go/token"
	"regexp"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
	"github.com/syntopica/codeality/packages/codeality-go/internal/syntax"
)

// The marker the go command itself recognises: https://go.dev/s/generatedcode.
var generatedMarker = regexp.MustCompile(`(?m)^// Code generated .* DO NOT EDIT\.$`)

// roleOf decides the single role of file, in the documented precedence.
func roleOf(file *File, cfg *config.Config) Role {
	switch {
	case isGenerated(file, cfg):
		return RoleGenerated
	case strings.HasSuffix(file.Stem, "_test"):
		return RoleTest
	case file.Stem == "doc":
		return RoleDoc
	case isEntrypoint(file):
		return RoleEntrypoint
	case isMethodsOnly(file):
		return RoleMethodsOnly
	case glob.Any(cfg.Roles.Data, file.Path):
		return RoleData
	default:
		return RoleOrdinary
	}
}

func isGenerated(file *File, cfg *config.Config) bool {
	if glob.Any(cfg.Generated, file.Path) {
		return true
	}

	header := file.Src
	if file.Syntax != nil && file.Syntax.Package.IsValid() {
		header = file.Src[:file.Fset.Position(file.Syntax.Package).Offset]
	}

	return generatedMarker.Match(header)
}

func isEntrypoint(file *File) bool {
	if file.PackageName() != "main" {
		return false
	}

	for _, decl := range file.Syntax.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Recv == nil && fn.Name.Name == "main" {
			return true
		}
	}

	return false
}

// isMethodsOnly reports a file that holds nothing but methods of one type.
func isMethodsOnly(file *File) bool {
	if file.Syntax == nil {
		return false
	}

	receiver := ""

	for _, decl := range file.Syntax.Decls {
		if gen, ok := decl.(*ast.GenDecl); ok && gen.Tok == token.IMPORT {
			continue
		}

		fn, ok := decl.(*ast.FuncDecl)
		if !ok || fn.Recv == nil {
			return false
		}

		name := syntax.ReceiverName(fn)
		if name == "" || (receiver != "" && name != receiver) {
			return false
		}

		receiver = name
	}

	return receiver != ""
}
