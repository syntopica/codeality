"""The ``baseline`` command group: the only writer of recorded debt."""

import click

from baseline_py.commands.baseline_check_command import baseline_check_command
from baseline_py.commands.baseline_update_command import baseline_update_command


@click.group(name="baseline")
def baseline_command() -> None:
    """Record and inspect migration debt. Only this group ever writes one."""


baseline_command.add_command(baseline_check_command)
baseline_command.add_command(baseline_update_command)
