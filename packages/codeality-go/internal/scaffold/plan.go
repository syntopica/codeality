package scaffold

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
)

const (
	dirPermissions  = 0o755
	filePermissions = 0o644
)

// Plan is everything init would do for one module. Making a plan writes
// nothing.
type Plan struct {
	// Root is the repository root, or the module itself outside one. The
	// paths of Files are relative to it.
	Root  string
	Files []PlannedFile
}

// NewPlan plans init for the module in dir. With ci it also plans the
// module's job in the repository's codeality.yml.
func NewPlan(dir string, ci bool) (*Plan, error) {
	module, err := filepath.Abs(dir)
	if err != nil {
		return nil, fmt.Errorf("resolve %s: %w", dir, err)
	}

	repository := repositoryRoot(module)

	relative, err := filepath.Rel(repository, module)
	if err != nil {
		return nil, fmt.Errorf("locate %s in %s: %w", module, repository, err)
	}

	root, err := os.OpenRoot(repository)
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", repository, err)
	}

	defer func() { _ = root.Close() }()

	workingDirectory := filepath.ToSlash(relative)
	plan := &Plan{Root: repository, Files: []PlannedFile{
		planModuleConfig(root, path.Join(workingDirectory, moduleConfigName)),
		planLintConfig(root, path.Join(workingDirectory, lintConfigName)),
	}}

	if !ci {
		return plan, nil
	}

	plan.Files = append(plan.Files, planWorkflow(root, workingDirectory))
	if caller, needed := planCaller(root.FS()); needed {
		plan.Files = append(plan.Files, caller)
	}

	return plan, nil
}

// Conflicts counts the files init would only write when forced.
func (p *Plan) Conflicts() int {
	count := 0

	for index := range p.Files {
		if p.Files[index].Disposition == Conflict {
			count++
		}
	}

	return count
}

// Apply writes the creations and the merges, and the conflicts when
// force. It returns what it wrote.
func (p *Plan) Apply(force bool) ([]PlannedFile, error) {
	root, err := os.OpenRoot(p.Root)
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", p.Root, err)
	}

	defer func() { _ = root.Close() }()

	var written []PlannedFile

	for index := range p.Files {
		planned := &p.Files[index]

		writable := planned.Disposition == Create || planned.Disposition == Merge ||
			(force && planned.Disposition == Conflict)
		if !writable || planned.Content == "" {
			continue
		}

		if err = root.MkdirAll(path.Dir(planned.Path), dirPermissions); err != nil {
			return written, fmt.Errorf("create the directory of %s: %w", planned.Path, err)
		}

		if err = root.WriteFile(planned.Path, []byte(planned.Content), filePermissions); err != nil {
			return written, fmt.Errorf("write %s: %w", planned.Path, err)
		}

		written = append(written, *planned)
	}

	return written, nil
}
