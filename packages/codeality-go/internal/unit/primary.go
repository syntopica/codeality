package unit

import "github.com/syntopica/codeality/packages/codeality-go/internal/naming"

// Primary returns the unit a file with the given stem is named after. When
// no name matches, the only exported unit, or else the only unit, is the one
// the file should have been named after.
func Primary(found Extraction, stem string) (Unit, bool) {
	want := naming.UnitStem(stem)

	var exported []Unit

	for _, candidate := range found.Units {
		for _, name := range candidate.Names {
			if naming.Snake(name) == want {
				return candidate, true
			}
		}

		if candidate.Exported() {
			exported = append(exported, candidate)
		}
	}

	switch {
	case len(exported) == 1:
		return exported[0], true
	case len(exported) == 0 && len(found.Units) == 1:
		return found.Units[0], true
	default:
		return Unit{}, false
	}
}
