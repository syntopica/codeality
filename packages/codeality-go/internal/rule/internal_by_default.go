package rule

import (
	"path"
	"slices"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// InternalByDefault is BGO007: a module that ships commands exports no
// package by accident. Everything outside cmd/ lives under internal/ unless
// the configuration declares it public.
func InternalByDefault() Rule {
	return Rule{Code: "BGO007", Name: "internal-by-default", Check: checkInternalByDefault}
}

func checkInternalByDefault(in *Input, file *source.File) []Violation {
	if !in.Module.HasCmd || !in.LeadsDirectory(file) {
		return nil
	}

	segments := strings.Split(file.Dir, "/")
	if segments[0] == "cmd" || slices.Contains(segments, "internal") {
		return nil
	}

	importPath := path.Join(in.Module.Path, file.Dir)
	if glob.Any(in.Config.PublicPackages, importPath) {
		return nil
	}

	message := "package " + importPath + " is importable by other modules; move it under internal/ or list it in public-packages"

	return []Violation{at(file, 0, importPath, message)}
}
