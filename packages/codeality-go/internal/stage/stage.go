package stage

import "context"

// Stage is one named step of the gate.
type Stage struct {
	Name string
	Run  func(ctx context.Context, env *Env) Result
}
