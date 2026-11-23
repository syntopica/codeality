package rule

import (
	"fmt"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// OneExportedUnit is BGO001: a file holds one unit and whatever unexported
// helpers only that unit uses. Each role has its own form of the rule.
func OneExportedUnit() Rule {
	return Rule{Code: "BGO001", Name: "one-exported-unit", Check: checkOneExportedUnit}
}

func checkOneExportedUnit(in *Input, file *source.File) []Violation {
	switch file.Role {
	case source.RoleOrdinary, source.RoleEntrypoint:
		return append(extraExported(in, file), strayMethods(in, file)...)
	case source.RoleMethodsOnly:
		return methodsWithoutType(in, file)
	case source.RoleData:
		return codeInData(in, file)
	case source.RoleDoc:
		return declarationsInDoc(file)
	case source.RoleTest, source.RoleGenerated:
		return nil
	}

	return nil
}

// extraExported reports every exported unit but the one the file is about.
func extraExported(in *Input, file *source.File) []Violation {
	found := in.Units(file)

	primary, hasPrimary := primaryOf(in, file)
	if !hasPrimary {
		if len(found.Units) < 2 {
			return nil
		}

		message := fmt.Sprintf("no unit is named after the file and it declares %d; one unit per file", len(found.Units))

		return []Violation{at(file, file.Syntax.Package, "", message)}
	}

	var violations []Violation

	for _, candidate := range found.Units {
		if candidate.Exported() && candidate.Pos != primary.Pos {
			message := fmt.Sprintf("exported %s %s shares a file with %s; give it its own file",
				candidate.Kind, candidate.Name(), primary.Name())
			violations = append(violations, at(file, candidate.Pos, candidate.Name(), message))
		}
	}

	return violations
}

// strayMethods reports methods declared away from their type.
func strayMethods(in *Input, file *source.File) []Violation {
	orphans := in.Units(file).Orphans
	violations := make([]Violation, 0, len(orphans))

	for _, orphan := range orphans {
		subject := orphan.Receiver + "." + orphan.Method
		message := fmt.Sprintf("method %s is declared away from type %s; move it beside the type or into a methods-only file",
			subject, orphan.Receiver)
		violations = append(violations, at(file, orphan.Pos, subject, message))
	}

	return violations
}
