"""The read-only ``check`` command."""

import sys
from pathlib import Path

import click

from baseline_py.config.config_error import ConfigError
from baseline_py.config.load_config import load_config
from baseline_py.engine.check_project import check_project
from baseline_py.parsing.infrastructure_error import InfrastructureError
from baseline_py.report.exit_code import ExitCode
from baseline_py.report.render_json_report import render_json_report
from baseline_py.report.render_text_report import render_text_report


@click.command(name="check")
@click.option(
    "--project",
    "project",
    type=click.Path(file_okay=False, exists=True, path_type=Path),
    default=Path("."),
    help="Project root to check. Defaults to the working directory.",
)
@click.option(
    "--format",
    "output_format",
    type=click.Choice(["text", "json"]),
    default="text",
    help="Report format. JSON goes to stdout alone.",
)
def check_command(project: Path, output_format: str) -> None:
    """Run the structural rules. This command never writes."""
    try:
        config = load_config(project.resolve())
        result = check_project(config)
    except ConfigError as error:
        click.echo(f"configuration error: {error}", err=True)
        sys.exit(ExitCode.CONFIGURATION)
    except InfrastructureError as error:
        click.echo(f"infrastructure error: {error}", err=True)
        sys.exit(ExitCode.INFRASTRUCTURE)
    rendered = (
        render_json_report(result)
        if output_format == "json"
        else render_text_report(result)
    )
    click.echo(rendered)
    sys.exit(ExitCode.FINDINGS if result.findings else ExitCode.OK)
