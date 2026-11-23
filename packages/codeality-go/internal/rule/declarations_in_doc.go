package rule

import "github.com/syntopica/codeality/packages/codeality-go/internal/source"

// declarationsInDoc reports anything in doc.go beyond the package comment
// and the package clause.
func declarationsInDoc(file *source.File) []Violation {
	if len(file.Syntax.Decls) == 0 {
		return nil
	}

	const message = "doc.go holds the package comment and the package clause, nothing else"

	return []Violation{at(file, file.Syntax.Decls[0].Pos(), "", message)}
}
