package cli

import (
	"flag"
	"fmt"
)

// parseFlags parses args with set and returns the arguments that are not
// flags. Unlike the flag package alone, it accepts flags after them:
// "check ./internal --format json" is what people type.
func parseFlags(set *flag.FlagSet, args []string) ([]string, error) {
	var positional []string

	for {
		if err := set.Parse(args); err != nil {
			return nil, fmt.Errorf("parse arguments: %w", err)
		}

		if set.NArg() == 0 {
			return positional, nil
		}

		positional = append(positional, set.Arg(0))
		args = set.Args()[1:]
	}
}
