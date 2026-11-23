package rule

import (
	"errors"
	"go/scanner"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// ParseError is BGO000: a file the parser rejects is a finding, never a
// silent skip. It is the only rule that runs on such a file.
func ParseError() Rule {
	return Rule{Code: "BGO000", Name: "parse-error", Check: checkParseError}
}

func checkParseError(_ *Input, file *source.File) []Violation {
	if file.ParseErr == nil {
		return nil
	}

	violation := Violation{Line: 1, Column: 1, Message: file.ParseErr.Error()}

	if list, ok := errors.AsType[scanner.ErrorList](file.ParseErr); ok && len(list) > 0 {
		violation.Line, violation.Column, violation.Message = list[0].Pos.Line, list[0].Pos.Column, list[0].Msg
	}

	return []Violation{violation}
}
