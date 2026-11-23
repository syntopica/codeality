package rule

import (
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
	"github.com/syntopica/codeality/packages/codeality-go/internal/unit"
)

// primaryOf returns the unit file is named after. An entrypoint is always
// about its main function, whatever the file is called.
func primaryOf(in *Input, file *source.File) (unit.Unit, bool) {
	found := in.Units(file)

	if file.Role == source.RoleEntrypoint {
		for _, candidate := range found.Units {
			if candidate.Kind == unit.KindFunction && candidate.Name() == mainName {
				return candidate, true
			}
		}
	}

	return unit.Primary(found, file.Stem)
}
