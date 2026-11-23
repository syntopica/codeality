package rule

import (
	"slices"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/naming"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// NoGrabBagNames is BGO003: a name that says nothing about its content is
// banned as a package name, a directory segment or a file stem.
func NoGrabBagNames() Rule {
	return Rule{Code: "BGO003", Name: "no-grab-bag-names", Check: checkNoGrabBagNames}
}

// grabBagNames lists the names the Go blog's "Package names" warns against,
// followed by the "one package for all the types" layout.
func grabBagNames() []string {
	return []string{
		"util", "utils", "helper", "helpers", "misc", "common", "shared", "base",
		"types", "interfaces", "models",
	}
}

func isGrabBag(name string) bool {
	return slices.Contains(grabBagNames(), strings.ToLower(name))
}

func checkNoGrabBagNames(in *Input, file *source.File) []Violation {
	var violations []Violation

	if stem := naming.UnitStem(file.Stem); isGrabBag(stem) {
		violations = append(violations,
			at(file, 0, "file:"+stem, "file name "+stem+" says nothing about its content; name it after its unit"))
	}

	if !in.LeadsDirectory(file) {
		return violations
	}

	for segment := range strings.SplitSeq(file.Dir, "/") {
		if isGrabBag(segment) {
			violations = append(violations,
				at(file, 0, "directory:"+segment, "directory "+segment+" says nothing about its content; name it after what it provides"))
		}
	}

	if name := strings.TrimSuffix(file.PackageName(), "_test"); isGrabBag(name) {
		violations = append(violations,
			at(file, file.Syntax.Name.Pos(), "package:"+name, "package "+name+" says nothing about its content; name it after what it provides"))
	}

	return violations
}
