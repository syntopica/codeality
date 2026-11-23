package syntax

import "go/ast"

// ReceiverName returns the receiver type name of a method, or "" when fn is
// a plain function.
func ReceiverName(fn *ast.FuncDecl) string {
	if fn.Recv == nil || len(fn.Recv.List) == 0 {
		return ""
	}

	return TypeName(fn.Recv.List[0].Type)
}
