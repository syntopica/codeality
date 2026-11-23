package rule

import (
	"fmt"
	"slices"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/naming"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// FileMatchesUnit is BGO002: the file stem is the snake_case of the unit
// the file is about.
func FileMatchesUnit() Rule {
	return Rule{Code: "BGO002", Name: "file-matches-unit", Check: checkFileMatchesUnit}
}

func checkFileMatchesUnit(in *Input, file *source.File) []Violation {
	stem := naming.UnitStem(file.Stem)

	switch file.Role {
	case source.RoleEntrypoint:
		if stem != mainName {
			return []Violation{at(file, file.Syntax.Package, mainName, "the file that declares func main is main.go")}
		}
	case source.RoleMethodsOnly:
		return methodsFileName(in, file, stem)
	case source.RoleOrdinary:
		return ordinaryFileName(in, file, stem)
	case source.RoleData, source.RoleDoc, source.RoleTest, source.RoleGenerated:
	}

	return nil
}

func ordinaryFileName(in *Input, file *source.File, stem string) []Violation {
	primary, ok := primaryOf(in, file)
	if !ok {
		return nil
	}

	wanted := make([]string, 0, len(primary.Names))
	for _, name := range primary.Names {
		wanted = append(wanted, naming.Snake(name))
	}

	if slices.Contains(wanted, stem) {
		return nil
	}

	message := fmt.Sprintf("file declares %s %s; name it %s.go", primary.Kind, primary.Name(), wanted[0])

	return []Violation{at(file, primary.Pos, primary.Name(), message)}
}

func methodsFileName(in *Input, file *source.File, stem string) []Violation {
	orphans := in.Units(file).Orphans
	if len(orphans) == 0 {
		return nil
	}

	receiver := orphans[0].Receiver

	prefix := naming.Snake(receiver) + "_"
	if strings.HasPrefix(stem, prefix) && len(stem) > len(prefix) {
		return nil
	}

	message := fmt.Sprintf("file holds methods of %s; name it %s<topic>.go", receiver, prefix)

	return []Violation{at(file, orphans[0].Pos, receiver, message)}
}
