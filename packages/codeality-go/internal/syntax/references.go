package syntax

import (
	"go/ast"
	"go/token"
	"path"
	"strings"
)

// References returns the names file uses that could be package-level
// declarations of another file, each with the position of its first use.
//
// The match is syntactic, so that it works on code that does not compile
// yet. A name is not a reference when it is the field of a selector, a
// struct-literal key, declared at the top of this file, an import name, or
// bound anywhere inside the declaration that uses it.
func References(file *ast.File) map[string]token.Pos {
	walker := &referenceWalker{found: make(map[string]token.Pos), bound: fileNames(file)}

	for _, decl := range file.Decls {
		if gen, ok := decl.(*ast.GenDecl); ok && gen.Tok == token.IMPORT {
			continue
		}

		walker.local = localNames(decl)
		ast.Walk(walker, decl)
	}

	return walker.found
}

type referenceWalker struct {
	found map[string]token.Pos
	bound map[string]bool
	local map[string]bool
}

// Visit implements [ast.Visitor].
func (w *referenceWalker) Visit(node ast.Node) ast.Visitor {
	switch typed := node.(type) {
	case *ast.Ident:
		w.record(typed)
	case *ast.SelectorExpr:
		ast.Walk(w, typed.X)

		return nil
	case *ast.Field:
		w.walk(typed.Type)

		return nil
	case *ast.CompositeLit:
		w.composite(typed)

		return nil
	case *ast.LabeledStmt:
		ast.Walk(w, typed.Stmt)

		return nil
	case *ast.BranchStmt:
		return nil
	}

	return w
}

func (w *referenceWalker) walk(expr ast.Expr) {
	if expr != nil {
		ast.Walk(w, expr)
	}
}

func (w *referenceWalker) record(ident *ast.Ident) {
	name := ident.Name
	if name == "_" || w.bound[name] || w.local[name] {
		return
	}

	if _, seen := w.found[name]; !seen {
		w.found[name] = ident.Pos()
	}
}

// composite skips the identifier keys of a struct literal, which name
// fields. Keys of a map or array literal are expressions and are walked.
func (w *referenceWalker) composite(lit *ast.CompositeLit) {
	w.walk(lit.Type)

	keysAreFields := true

	switch lit.Type.(type) {
	case *ast.MapType, *ast.ArrayType:
		keysAreFields = false
	}

	for _, element := range lit.Elts {
		pair, keyed := element.(*ast.KeyValueExpr)
		if _, isName := keyOf(pair).(*ast.Ident); keyed && isName && keysAreFields {
			ast.Walk(w, pair.Value)

			continue
		}

		ast.Walk(w, element)
	}
}

func keyOf(pair *ast.KeyValueExpr) ast.Expr {
	if pair == nil {
		return nil
	}

	return pair.Key
}

// fileNames lists what file itself declares at the top level or imports.
func fileNames(file *ast.File) map[string]bool {
	names := make(map[string]bool)

	for _, spec := range file.Imports {
		if spec.Name != nil {
			names[spec.Name.Name] = true
		}

		names[path.Base(strings.Trim(spec.Path.Value, `"`))] = true
	}

	for _, decl := range file.Decls {
		switch typed := decl.(type) {
		case *ast.FuncDecl:
			if typed.Recv == nil {
				names[typed.Name.Name] = true
			}
		case *ast.GenDecl:
			addSpecNames(names, typed.Specs)
		}
	}

	return names
}

func addSpecNames(names map[string]bool, specs []ast.Spec) {
	for _, spec := range specs {
		switch typed := spec.(type) {
		case *ast.TypeSpec:
			names[typed.Name.Name] = true
		case *ast.ValueSpec:
			for _, name := range typed.Names {
				names[name.Name] = true
			}
		}
	}
}

// localNames lists every name bound anywhere inside decl. Treating a name
// as bound for the whole declaration misses a use that precedes its own
// shadowing, which costs a missed finding, never a false one.
func localNames(decl ast.Decl) map[string]bool {
	names := make(map[string]bool)

	ast.Inspect(decl, func(node ast.Node) bool {
		switch typed := node.(type) {
		case *ast.FuncDecl:
			names[typed.Name.Name] = typed.Recv != nil
		case *ast.Field:
			addIdents(names, typed.Names)
		case *ast.AssignStmt:
			if typed.Tok == token.DEFINE {
				addExprs(names, typed.Lhs...)
			}
		case *ast.RangeStmt:
			if typed.Tok == token.DEFINE {
				addExprs(names, typed.Key, typed.Value)
			}
		case *ast.GenDecl:
			addSpecNames(names, typed.Specs)
		}

		return true
	})

	return names
}

func addIdents(names map[string]bool, idents []*ast.Ident) {
	for _, ident := range idents {
		names[ident.Name] = true
	}
}

func addExprs(names map[string]bool, exprs ...ast.Expr) {
	for _, expr := range exprs {
		if ident, ok := expr.(*ast.Ident); ok {
			names[ident.Name] = true
		}
	}
}
