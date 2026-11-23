package rule

import (
	"go/token"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// at builds a violation positioned at pos in file.
func at(file *source.File, pos token.Pos, subject, message string) Violation {
	line, column := 1, 1
	if pos.IsValid() {
		line, column = file.Position(pos)
	}

	return Violation{Line: line, Column: column, Subject: subject, Message: message}
}
