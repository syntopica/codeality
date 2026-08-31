"""Load a project's configuration and run the checker over it."""

import sys
from pathlib import Path

import click

from baseline_py.config.config_error import ConfigError
from baseline_py.config.load_config import load_config
from baseline_py.engine.check_project import check_project
from baseline_py.engine.check_result import CheckResult
from baseline_py.parsing.infrastructure_error import InfrastructureError
from baseline_py.report.exit_code import ExitCode


def checked_project(project: Path) -> tuple[Path, CheckResult]:
    """Return the resolved root and its findings, exiting on any failure."""
    root = project.resolve()
    try:
        return root, check_project(load_config(root))
    except ConfigError as error:
        click.echo(f"configuration error: {error}", err=True)
        sys.exit(ExitCode.CONFIGURATION)
    except InfrastructureError as error:
        click.echo(f"infrastructure error: {error}", err=True)
        sys.exit(ExitCode.INFRASTRUCTURE)
