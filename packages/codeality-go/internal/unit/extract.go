package unit

import (
	"go/ast"
	"go/token"

	"github.com/syntopica/codeality/packages/codeality-go/internal/syntax"
)

// Extract lists the units of file. Methods, constructors and typed values
// are folded into the type they belong to when it is declared in the file.
func Extract(file *ast.File) Extraction {
	types := declaredTypes(file)

	var found Extraction

	for _, decl := range file.Decls {
		switch typed := decl.(type) {
		case *ast.FuncDecl:
			addFunction(&found, typed, types)
		case *ast.GenDecl:
			addGeneral(&found, typed, types)
		}
	}

	return found
}

func declaredTypes(file *ast.File) map[string]bool {
	types := make(map[string]bool)

	for _, decl := range file.Decls {
		gen, ok := decl.(*ast.GenDecl)
		if !ok || gen.Tok != token.TYPE {
			continue
		}

		for _, spec := range gen.Specs {
			if typeSpec, ok := spec.(*ast.TypeSpec); ok {
				types[typeSpec.Name.Name] = true
			}
		}
	}

	return types
}

func addFunction(found *Extraction, fn *ast.FuncDecl, types map[string]bool) {
	if fn.Recv != nil {
		if receiver := syntax.ReceiverName(fn); !types[receiver] {
			found.Orphans = append(found.Orphans, Orphan{Receiver: receiver, Method: fn.Name.Name, Pos: fn.Pos()})
		}

		return
	}

	if results := fn.Type.Results; results != nil && len(results.List) > 0 {
		if types[syntax.TypeName(results.List[0].Type)] {
			return
		}
	}

	found.Units = append(found.Units, Unit{Names: []string{fn.Name.Name}, Kind: KindFunction, Pos: fn.Pos()})
}

func addGeneral(found *Extraction, gen *ast.GenDecl, types map[string]bool) {
	if gen.Tok == token.TYPE {
		for _, spec := range gen.Specs {
			if typeSpec, ok := spec.(*ast.TypeSpec); ok {
				name := typeSpec.Name
				found.Units = append(found.Units, Unit{Names: []string{name.Name}, Kind: KindType, Pos: name.Pos()})
			}
		}

		return
	}

	if gen.Tok != token.CONST && gen.Tok != token.VAR {
		return
	}

	if names := freeValueNames(gen, types); len(names) > 0 {
		found.Units = append(found.Units, Unit{Names: names, Kind: KindValue, Pos: gen.Pos()})
	}
}

// freeValueNames returns the names of a const or var declaration that do not
// belong to a type of the file. It is empty when every value is typed as one
// of those types or is the blank identifier.
func freeValueNames(gen *ast.GenDecl, types map[string]bool) []string {
	var names []string

	owned := true
	inherited := ""

	for _, spec := range gen.Specs {
		value, ok := spec.(*ast.ValueSpec)
		if !ok {
			continue
		}

		declared := valueType(value, inherited)
		inherited = declared

		for _, name := range value.Names {
			if name.Name == "_" {
				continue
			}

			names = append(names, name.Name)
			owned = owned && types[declared]
		}
	}

	if owned {
		return nil
	}

	return names
}

// valueType names the type a value spec is declared with. A constant with
// neither type nor value repeats the previous spec, as iota blocks do.
func valueType(value *ast.ValueSpec, inherited string) string {
	if value.Type != nil {
		return syntax.TypeName(value.Type)
	}

	if len(value.Values) == 0 {
		return inherited
	}

	return expressionType(value.Values[0])
}

// expressionType recognises the two expressions that state their type:
// a conversion or constructor-like call T(x), and a composite literal T{}.
func expressionType(expr ast.Expr) string {
	switch typed := expr.(type) {
	case *ast.CallExpr:
		return syntax.TypeName(typed.Fun)
	case *ast.CompositeLit:
		return syntax.TypeName(typed.Type)
	case *ast.UnaryExpr:
		return expressionType(typed.X)
	default:
		return ""
	}
}
