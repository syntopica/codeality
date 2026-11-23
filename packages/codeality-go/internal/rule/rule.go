package rule

import "github.com/syntopica/codeality/packages/codeality-go/internal/source"

// Rule is one structural check, applied to every file that parsed and is
// not generated.
type Rule struct {
	Code  string
	Name  string
	Check func(in *Input, file *source.File) []Violation
}
