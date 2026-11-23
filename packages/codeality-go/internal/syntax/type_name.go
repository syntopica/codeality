package syntax

import "go/ast"

// TypeName returns the name of the named type expr refers to once pointers,
// parentheses and type arguments are removed: "*Lease[T]" is "Lease". It
// returns "" for a type from another package or one without a name.
func TypeName(expr ast.Expr) string {
	switch typed := expr.(type) {
	case *ast.Ident:
		return typed.Name
	case *ast.StarExpr:
		return TypeName(typed.X)
	case *ast.ParenExpr:
		return TypeName(typed.X)
	case *ast.IndexExpr:
		return TypeName(typed.X)
	case *ast.IndexListExpr:
		return TypeName(typed.X)
	default:
		return ""
	}
}
