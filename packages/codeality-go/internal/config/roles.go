package config

// Roles assigns files to the roles that cannot be inferred from the source.
type Roles struct {
	// Data lists globs of files that hold only constants and variables.
	Data []string `yaml:"data"`
}
