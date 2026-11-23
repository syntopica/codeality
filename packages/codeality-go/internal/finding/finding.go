package finding

import (
	"cmp"
	"fmt"
)

// Finding is one rule violation at a position in a source file.
type Finding struct {
	// Path is relative to the module root and uses forward slashes.
	Path    string `json:"path"`
	Line    int    `json:"line"`
	Column  int    `json:"column"`
	Code    string `json:"code"`
	Rule    string `json:"slug"`
	Message string `json:"message"`
	// Subject names what is wrong, independently of where it sits. It is
	// what a baseline fingerprint is made of, so it must survive edits
	// elsewhere in the file.
	Subject string `json:"subject"`
	// Fingerprint and BaselineState are filled in once the finding has
	// been compared with the recorded debt.
	Fingerprint   string `json:"fingerprint"`
	BaselineState string `json:"baseline_state"`
}

// String renders the finding as a compiler-style diagnostic line.
func (f *Finding) String() string {
	return fmt.Sprintf("%s:%d:%d: %s %s: %s", f.Path, f.Line, f.Column, f.Code, f.Rule, f.Message)
}

// Compare orders findings by path, then position, then code.
func (f *Finding) Compare(other *Finding) int {
	return cmp.Or(
		cmp.Compare(f.Path, other.Path),
		cmp.Compare(f.Line, other.Line),
		cmp.Compare(f.Column, other.Column),
		cmp.Compare(f.Code, other.Code),
	)
}
