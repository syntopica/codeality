package source

import (
	"fmt"
	"io/fs"
	"path"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
)

// Load parses every Go file of the module rooted at fsys that the go command
// would build and the configuration does not exclude.
func Load(fsys fs.FS, cfg *config.Config) (*Module, error) {
	modPath, err := ModulePath(fsys)
	if err != nil {
		return nil, err
	}

	module := &Module{Path: modPath}

	err = fs.WalkDir(fsys, ".", func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}

		if entry.IsDir() {
			module.HasCmd = module.HasCmd || name == "cmd"

			return dirVerdict(fsys, name)
		}

		return addFile(fsys, name, cfg, module)
	})
	if err != nil {
		return nil, fmt.Errorf("walk module: %w", err)
	}

	return module, nil
}

// addFile parses name into module unless it is not Go or is excluded.
func addFile(fsys fs.FS, name string, cfg *config.Config, module *Module) error {
	if !strings.HasSuffix(name, ".go") || glob.Any(cfg.Exclude, name) {
		return nil
	}

	if glob.Any(cfg.Generated, name) && glob.Any(cfg.Roles.Data, name) {
		return &config.InvalidError{Reason: name + " is claimed by both generated and roles.data"}
	}

	file, err := parseFile(fsys, name)
	if err != nil {
		return err
	}

	file.Role = roleOf(file, cfg)
	module.Files = append(module.Files, file)

	return nil
}

// dirVerdict skips the directories the go command ignores, and nested
// modules, which are checked by their own run.
func dirVerdict(fsys fs.FS, name string) error {
	if name == "." {
		return nil
	}

	base := path.Base(name)
	if base == "vendor" || base == "testdata" || strings.HasPrefix(base, ".") || strings.HasPrefix(base, "_") {
		return fs.SkipDir
	}

	if _, err := fs.Stat(fsys, path.Join(name, "go.mod")); err == nil {
		return fs.SkipDir
	}

	return nil
}
