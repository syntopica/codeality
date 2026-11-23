package baseline

import "errors"

// ErrUnreadable reports a baseline file that exists but cannot be used.
var ErrUnreadable = errors.New("unusable baseline")
