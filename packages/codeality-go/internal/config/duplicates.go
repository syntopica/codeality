package config

// Duplicates tunes the clone detector of the duplicates gate stage.
type Duplicates struct {
	MinTokens int     `yaml:"min-tokens"`
	Threshold float64 `yaml:"threshold"`
}
