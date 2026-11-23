package source

// Module is the set of files one go.mod governs.
type Module struct {
	// Path is the module path declared in go.mod.
	Path string
	// HasCmd reports whether the module root has a cmd directory.
	HasCmd bool
	Files  []*File
}

// ByDir groups the files by directory, which in Go is by package.
func (m *Module) ByDir() map[string][]*File {
	grouped := make(map[string][]*File)

	for _, file := range m.Files {
		grouped[file.Dir] = append(grouped[file.Dir], file)
	}

	return grouped
}
