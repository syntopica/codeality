package rule

import (
	"slices"

	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
	"github.com/syntopica/codeality/packages/codeality-go/internal/naming"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// TestBesideUnit is BGO009: x_test.go tests x.go, in the same directory.
// A test file named after nothing is where unrelated tests pile up.
func TestBesideUnit() Rule {
	return Rule{Code: "BGO009", Name: "test-beside-unit", Check: checkTestBesideUnit}
}

// packageTestStems lists the test files that are about the package as a
// whole, by convention of the testing package and the standard library.
func packageTestStems() []string {
	return []string{"main", "export", "example", "doc", "bench", "fuzz", "integration"}
}

func checkTestBesideUnit(in *Input, file *source.File) []Violation {
	if file.Role != source.RoleTest || glob.Any(in.Config.TestFiles, file.Path) {
		return nil
	}

	subject := naming.UnitStem(file.Stem)
	if slices.Contains(packageTestStems(), subject) {
		return nil
	}

	for _, sibling := range in.Siblings(file) {
		if sibling.Role != source.RoleTest && naming.UnitStem(sibling.Stem) == subject {
			return nil
		}
	}

	message := "no " + subject + ".go beside this test; name the test after the file it tests"

	return []Violation{at(file, 0, subject, message)}
}
