package config

// Override turns rules off for the files its globs match. A reason is
// mandatory: an exception nobody can explain is debt, not policy.
type Override struct {
	Paths   []string `yaml:"paths"`
	Disable []string `yaml:"disable"`
	Reason  string   `yaml:"reason"`
}
