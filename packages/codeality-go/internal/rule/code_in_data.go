package rule

import (
	"fmt"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
	"github.com/syntopica/codeality/packages/codeality-go/internal/unit"
)

// codeInData reports functions, types and methods in a data file, which
// holds constants, variables and embedded assets only.
func codeInData(in *Input, file *source.File) []Violation {
	found := in.Units(file)

	var violations []Violation

	for _, candidate := range found.Units {
		if candidate.Kind != unit.KindValue {
			message := fmt.Sprintf("%s %s in a data file; data files hold constants and variables only",
				candidate.Kind, candidate.Name())
			violations = append(violations, at(file, candidate.Pos, candidate.Name(), message))
		}
	}

	for _, orphan := range found.Orphans {
		subject := orphan.Receiver + "." + orphan.Method
		violations = append(violations, at(file, orphan.Pos, subject, "method "+subject+" in a data file"))
	}

	return violations
}
