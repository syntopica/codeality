package rule

import (
	"go/ast"
	"go/token"
	"strconv"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// NoInlineSQL is BGO006: a query is a file of its own, embedded at build
// time, where it can be read, formatted and reviewed as SQL.
func NoInlineSQL() Rule {
	return Rule{Code: "BGO006", Name: "no-inline-sql", Check: checkNoInlineSQL}
}

const sqlSubjectLength = 80

func checkNoInlineSQL(in *Input, file *source.File) []Violation {
	if glob.Any(in.Config.SQLGlobs, file.Path) {
		return nil
	}

	var violations []Violation

	ast.Inspect(file.Syntax, func(node ast.Node) bool {
		literal, ok := node.(*ast.BasicLit)
		if !ok || literal.Kind != token.STRING {
			return true
		}

		text, err := strconv.Unquote(literal.Value)
		if err != nil || !looksLikeSQL(text) {
			return true
		}

		subject := strings.Join(strings.Fields(text), " ")
		if len(subject) > sqlSubjectLength {
			subject = subject[:sqlSubjectLength]
		}

		violations = append(violations,
			at(file, literal.Pos(), subject, "SQL in a string literal; move the query to a .sql file and load it with //go:embed"))

		return true
	})

	return violations
}
