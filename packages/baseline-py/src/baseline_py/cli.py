"""Command-line entry point for baseline-py."""

from importlib.metadata import version

import click

from baseline_py.commands.check_command import check_command
from baseline_py.commands.init_command import init_command


@click.group(name="baseline-py")
@click.version_option(version("busirocket-baseline-py"), prog_name="baseline-py")
def cli() -> None:
    """Structural linter and config scaffolder for Python."""


cli.add_command(check_command)
cli.add_command(init_command)
