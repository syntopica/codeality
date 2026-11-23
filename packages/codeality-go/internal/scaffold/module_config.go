package scaffold

import _ "embed" // the starting configuration is embedded in the binary

// moduleConfig is the codeality-go.yaml init writes once.
//
//go:embed assets/codeality-go.yaml
var moduleConfig string
