package rule

import (
	"fmt"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
	"github.com/syntopica/codeality/packages/codeality-go/internal/unit"
)

// methodsWithoutType reports a methods-only file whose receiver type is not
// declared in its package.
func methodsWithoutType(in *Input, file *source.File) []Violation {
	orphans := in.Units(file).Orphans
	if len(orphans) == 0 {
		return nil
	}

	receiver := orphans[0].Receiver

	for _, sibling := range in.Siblings(file) {
		for _, candidate := range in.Units(sibling).Units {
			if candidate.Kind == unit.KindType && candidate.Name() == receiver {
				return nil
			}
		}
	}

	message := fmt.Sprintf("methods of %s, which is not declared in this package", receiver)

	return []Violation{at(file, orphans[0].Pos, receiver, message)}
}
