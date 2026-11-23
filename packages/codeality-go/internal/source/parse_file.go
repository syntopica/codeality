package source

import (
	"fmt"
	"go/parser"
	"go/token"
	"io/fs"
	"path"
	"strings"
)

// parseFile reads and parses one file. A syntax error is recorded on the
// file, not returned: rule BGO000 reports it.
func parseFile(fsys fs.FS, name string) (*File, error) {
	src, err := fs.ReadFile(fsys, name)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", name, err)
	}

	fset := token.NewFileSet()
	syntax, parseErr := parser.ParseFile(fset, name, src, parser.ParseComments|parser.SkipObjectResolution)

	return &File{
		Path:     name,
		Dir:      path.Dir(name),
		Stem:     strings.TrimSuffix(path.Base(name), ".go"),
		Src:      src,
		Fset:     fset,
		Syntax:   syntax,
		ParseErr: parseErr,
	}, nil
}
