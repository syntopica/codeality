package config

const (
	schemaVersion           = 1
	defaultMaxFileLines     = 200
	defaultTestMaxFileLines = 400
	defaultCoverage         = 80
	defaultTestBudget       = 120
	defaultMinTokens        = 70
)

// Config is the content of codeality-go.yaml with every default applied.
type Config struct {
	SchemaVersion     int        `yaml:"schema-version"`
	Exclude           []string   `yaml:"exclude"`
	Generated         []string   `yaml:"generated"`
	Roles             Roles      `yaml:"roles"`
	PublicPackages    []string   `yaml:"public-packages"`
	SQLGlobs          []string   `yaml:"sql-globs"`
	TestFiles         []string   `yaml:"test-files"`
	Limits            Limits     `yaml:"limits"`
	CoverageThreshold float64    `yaml:"coverage-threshold"`
	CoverageExclude   []string   `yaml:"coverage-exclude"`
	TestBudgetSeconds int        `yaml:"test-budget-seconds"`
	Race              bool       `yaml:"race"`
	Duplicates        Duplicates `yaml:"duplicates"`
	Overrides         []Override `yaml:"overrides"`
}

// Default returns the configuration of a module that has no file, which is
// also the base every file is decoded onto.
func Default() *Config {
	return &Config{
		SchemaVersion:     schemaVersion,
		SQLGlobs:          []string{"**/*.sql"},
		Limits:            Limits{MaxFileLines: defaultMaxFileLines, TestMaxFileLines: defaultTestMaxFileLines},
		CoverageThreshold: defaultCoverage,
		CoverageExclude:   []string{"cmd/**"},
		TestBudgetSeconds: defaultTestBudget,
		Race:              true,
		Duplicates:        Duplicates{MinTokens: defaultMinTokens, Threshold: 1},
	}
}

// Validate reports the first setting no run can honour.
func (c *Config) Validate() error {
	if c.SchemaVersion != schemaVersion {
		return &InvalidError{Reason: "schema-version must be 1"}
	}

	if c.Limits.MaxFileLines <= 0 || c.Limits.TestMaxFileLines <= 0 {
		return &InvalidError{Reason: "limits must be positive"}
	}

	if c.CoverageThreshold < 0 || c.CoverageThreshold > 100 {
		return &InvalidError{Reason: "coverage-threshold must be between 0 and 100"}
	}

	for _, override := range c.Overrides {
		if override.Reason == "" || len(override.Paths) == 0 || len(override.Disable) == 0 {
			return &InvalidError{Reason: "every override needs paths, disable and a reason"}
		}
	}

	return nil
}
