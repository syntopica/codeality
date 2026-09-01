"""The ``gate`` command: the whole quality chain, defined once."""

import sys
from pathlib import Path

import click

from baseline_py.config.config_error import ConfigError
from baseline_py.config.load_config import load_config
from baseline_py.gate.run_gate import run_gate
from baseline_py.report.exit_code import ExitCode
from baseline_py.report.render_gate_report import render_gate_report


@click.command(name="gate")
@click.option(
    "--project",
    type=click.Path(file_okay=False, exists=True, path_type=Path),
    default=Path(),
    help="Project root to gate. Defaults to the working directory.",
)
@click.option("--fail-fast", is_flag=True, help="Stop at the first blocking failure.")
@click.option("--json", "as_json", is_flag=True, help="Emit the machine-readable summary.")
def gate_command(project: Path, fail_fast: bool, as_json: bool) -> None:
    """Run ruff, mypy, the structural rules, deptry, pip-audit and pytest."""
    try:
        config = load_config(project.resolve())
    except ConfigError as error:
        click.echo(f"configuration error: {error}", err=True)
        sys.exit(ExitCode.CONFIGURATION)
    result = run_gate(config, fail_fast)
    click.echo(render_gate_report(result, as_json))
    sys.exit(result.exit_code())
