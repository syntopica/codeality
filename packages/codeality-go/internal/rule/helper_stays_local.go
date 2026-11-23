package rule

import (
	"fmt"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// HelperStaysLocal is BGO008: an unexported declaration that is not the
// unit of its file is used only in that file. Once a second file needs it,
// it is a unit and gets a file of its own.
func HelperStaysLocal() Rule {
	return Rule{Code: "BGO008", Name: "helper-stays-local", Check: checkHelperStaysLocal}
}

func checkHelperStaysLocal(in *Input, file *source.File) []Violation {
	if file.Role != source.RoleOrdinary && file.Role != source.RoleEntrypoint {
		return nil
	}

	primary, hasPrimary := primaryOf(in, file)

	var violations []Violation

	for _, helper := range in.Units(file).Units {
		if helper.Exported() || (hasPrimary && helper.Pos == primary.Pos) {
			continue
		}

		for _, name := range helper.Names {
			if user := userOf(in, file, name); user != "" {
				message := fmt.Sprintf("%s is a helper of this file but %s uses it too; give it its own file", name, user)
				violations = append(violations, at(file, helper.Pos, name, message))
			}
		}
	}

	return violations
}

// userOf returns the first other non-test file of the package that refers
// to name. Tests may reach any unexported name.
func userOf(in *Input, file *source.File, name string) string {
	for _, sibling := range in.Siblings(file) {
		if sibling == file || sibling.Role == source.RoleTest || sibling.PackageName() != file.PackageName() {
			continue
		}

		if _, used := in.References(sibling)[name]; used {
			return sibling.Stem + ".go"
		}
	}

	return ""
}
