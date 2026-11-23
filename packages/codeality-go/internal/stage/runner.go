package stage

import "context"

// Runner starts a tool in dir and waits for it. Stages take it as a
// parameter so that tests can stand in for the tools.
type Runner func(ctx context.Context, dir, name string, args ...string) ToolRun
