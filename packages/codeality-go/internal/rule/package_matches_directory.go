package rule

import (
	"fmt"
	"path"
	"regexp"
	"slices"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// PackageMatchesDirectory is BGO005: the package clause names the
// directory, in lower case without underscores.
func PackageMatchesDirectory() Rule {
	return Rule{Code: "BGO005", Name: "package-matches-directory", Check: checkPackageMatchesDirectory}
}

var (
	packageName  = regexp.MustCompile(`^[a-z][a-z0-9]*$`)
	majorVersion = regexp.MustCompile(`^v\d+$`)
)

func checkPackageMatchesDirectory(in *Input, file *source.File) []Violation {
	name := file.PackageName()
	if file.Role == source.RoleTest {
		name = strings.TrimSuffix(name, "_test")
	}

	if name == mainName {
		return nil
	}

	report := func(message string) []Violation {
		return []Violation{at(file, file.Syntax.Name.Pos(), name, message)}
	}

	if slices.Contains([]string{"internal", "cmd", "testdata"}, name) {
		return report(name + " is a directory the go command gives a meaning to, not a package name")
	}

	if !packageName.MatchString(name) {
		return report("package " + name + " is not a lower-case word; no underscores or mixed caps")
	}

	if want := directoryName(in.Module.Path, file.Dir); packageName.MatchString(want) && want != name {
		return report(fmt.Sprintf("package %s lives in directory %s; they must match", name, want))
	}

	return nil
}

// directoryName returns the last element of the import path of dir, without
// the major-version element a module path may end in.
func directoryName(modulePath, dir string) string {
	if dir != "." {
		return path.Base(dir)
	}

	if base := path.Base(modulePath); !majorVersion.MatchString(base) {
		return base
	}

	return path.Base(path.Dir(modulePath))
}
