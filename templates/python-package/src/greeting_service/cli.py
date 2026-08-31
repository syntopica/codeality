"""Command-line entry point, declared as an entrypoint module."""

import sys

from greeting_service.greeting import Greeting


def cli() -> None:
    """Print a greeting for the name given on the command line."""
    recipient = sys.argv[1] if len(sys.argv) > 1 else "world"
    sys.stdout.write(Greeting(recipient=recipient).rendered() + "\n")


if __name__ == "__main__":
    cli()
