package config

// Limits caps the occupied, non-comment lines of a file (BGO004).
type Limits struct {
	MaxFileLines     int `yaml:"max-file-lines"`
	TestMaxFileLines int `yaml:"test-max-file-lines"`
}
