package rule

import (
	"fmt"
	"go/scanner"
	"go/token"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// MaxFileLines is BGO004: a cap on the lines of a file that hold code.
// Blank lines and comments are free, so the cap never argues against
// documentation.
func MaxFileLines() Rule {
	return Rule{Code: "BGO004", Name: "max-file-lines", Check: checkMaxFileLines}
}

func checkMaxFileLines(in *Input, file *source.File) []Violation {
	limit := in.Config.Limits.MaxFileLines
	if file.Role == source.RoleTest {
		limit = in.Config.Limits.TestMaxFileLines
	}

	lines := codeLines(file.Src)
	if lines <= limit {
		return nil
	}

	message := fmt.Sprintf("file has %d lines of code; the limit is %d", lines, limit)

	return []Violation{{Line: 1, Column: 1, Message: message}}
}

// codeLines counts the lines of src that carry at least one token.
func codeLines(src []byte) int {
	file := token.NewFileSet().AddFile("", -1, len(src))

	var lexer scanner.Scanner

	lexer.Init(file, src, nil, 0)

	occupied := make(map[int]struct{})

	for {
		pos, tok, literal := lexer.Scan()
		if tok == token.EOF {
			return len(occupied)
		}

		if tok == token.SEMICOLON && literal == "\n" {
			continue
		}

		first := file.Line(pos)
		for line := first; line <= first+strings.Count(literal, "\n"); line++ {
			occupied[line] = struct{}{}
		}
	}
}
