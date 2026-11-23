package rule

import (
	"go/token"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
	"github.com/syntopica/codeality/packages/codeality-go/internal/syntax"
	"github.com/syntopica/codeality/packages/codeality-go/internal/unit"
)

// Input is what every rule sees: the module, its configuration, and the
// facts several rules derive from them, computed once.
type Input struct {
	Module *source.Module
	Config *config.Config

	dirs       map[string][]*source.File
	units      map[string]unit.Extraction
	references map[string]map[string]token.Pos
}

// NewInput prepares the shared facts of module.
func NewInput(module *source.Module, cfg *config.Config) *Input {
	in := &Input{
		Module:     module,
		Config:     cfg,
		dirs:       module.ByDir(),
		units:      make(map[string]unit.Extraction, len(module.Files)),
		references: make(map[string]map[string]token.Pos),
	}

	for _, file := range module.Files {
		if file.Syntax != nil {
			in.units[file.Path] = unit.Extract(file.Syntax)
		}
	}

	return in
}

// Units returns what file declares.
func (in *Input) Units(file *source.File) unit.Extraction {
	return in.units[file.Path]
}

// Siblings returns every file in the directory of file, itself included,
// in path order.
func (in *Input) Siblings(file *source.File) []*source.File {
	return in.dirs[file.Dir]
}

// LeadsDirectory reports whether file is the first of its directory, which
// is where a violation about the directory itself is reported, once.
func (in *Input) LeadsDirectory(file *source.File) bool {
	return in.dirs[file.Dir][0] == file
}

// References returns the package-level names file may refer to.
func (in *Input) References(file *source.File) map[string]token.Pos {
	if file.Syntax == nil || file.ParseErr != nil {
		return nil
	}

	found, cached := in.references[file.Path]
	if !cached {
		found = syntax.References(file.Syntax)
		in.references[file.Path] = found
	}

	return found
}
