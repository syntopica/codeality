"""The --project option shared by every command."""

from pathlib import Path

import click

PROJECT_OPTION = click.option(
    "--project",
    type=click.Path(file_okay=False, exists=True, path_type=Path),
    default=Path(),
    help="Project root. Defaults to the working directory.",
)
