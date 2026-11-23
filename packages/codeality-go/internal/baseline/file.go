package baseline

// File is the recorded debt of one module: per section, how many findings
// with each fingerprint are known. It is a multiset because one line of
// code can be wrong the same way twice in a file.
type File struct {
	SchemaVersion int                       `json:"schemaVersion"`
	ToolVersion   string                    `json:"toolVersion"`
	Sections      map[string]map[string]int `json:"sections"`
}

// New returns an empty baseline written by the given tool version.
func New(toolVersion string) *File {
	return &File{SchemaVersion: schemaVersion, ToolVersion: toolVersion, Sections: make(map[string]map[string]int)}
}

// Section returns the fingerprints recorded under name and whether the
// section exists. A nil file has no sections.
func (f *File) Section(name string) (map[string]int, bool) {
	if f == nil {
		return nil, false
	}

	section, ok := f.Sections[name]

	return section, ok
}

// Record replaces the section name with the given fingerprints.
func (f *File) Record(name string, fingerprints []string) {
	counts := make(map[string]int, len(fingerprints))
	for _, fingerprint := range fingerprints {
		counts[fingerprint]++
	}

	f.Sections[name] = counts
}
