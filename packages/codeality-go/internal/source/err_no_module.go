package source

import "errors"

// ErrNoModule reports a directory without a usable go.mod.
var ErrNoModule = errors.New("no module directive in go.mod")
