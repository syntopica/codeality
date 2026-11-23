package scaffold

import _ "embed" // the shipped configuration is embedded in the binary

// lintConfig is the strict .golangci.yml init writes. It ends at the
// "local overrides" marker; what a module adds below is its own.
//
//go:embed assets/golangci.yml
var lintConfig string
