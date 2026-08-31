"""Command-line entry point for baseline-py."""

from importlib.metadata import version

import click


@click.group(name="baseline-py")
@click.version_option(version("busirocket-baseline-py"), prog_name="baseline-py")
def cli() -> None:
    """Structural linter and config scaffolder for Python."""
