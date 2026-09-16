"""Command-line entry point for codeality-py."""

from importlib.metadata import version

import click

from codeality_py.commands.baseline_command import baseline_command
from codeality_py.commands.check_command import check_command
from codeality_py.commands.gate_command import gate_command
from codeality_py.commands.init_command import init_command


@click.group(name="codeality-py")
@click.version_option(version("syntopica-codeality-py"), prog_name="codeality-py")
def cli() -> None:
    """Structural linter and config scaffolder for Python."""


cli.add_command(baseline_command)
cli.add_command(check_command)
cli.add_command(gate_command)
cli.add_command(init_command)
