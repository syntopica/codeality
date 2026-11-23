// Command codeality-go is the quality gate for Go modules: structural
// rules of its own, and one command that runs them with the formatter, the
// linter, the duplicate detector, the tests and the vulnerability audit.
package main

import (
	"context"
	"os"
	"os/signal"

	"github.com/syntopica/codeality/packages/codeality-go/internal/cli"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	app := cli.App{Dir: ".", Stdout: os.Stdout, Stderr: os.Stderr, Runner: stage.Execute}
	code := app.Main(ctx, os.Args[1:])

	stop()
	os.Exit(int(code))
}
