package unit

import "go/token"

// Orphan is a method whose receiver type is declared in another file.
type Orphan struct {
	Receiver string
	Method   string
	Pos      token.Pos
}
