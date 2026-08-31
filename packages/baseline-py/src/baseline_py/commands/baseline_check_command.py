"""Report current findings against the recorded baseline."""

import sys
from pathlib import Path

import click

from baseline_py.baseline.baseline_file import BASELINE_FILENAME
from baseline_py.baseline.classify_findings import classify_findings
from baseline_py.baseline.read_baseline import read_baseline
from baseline_py.commands.checked_project import checked_project
from baseline_py.commands.project_option import PROJECT_OPTION
from baseline_py.report.exit_code import ExitCode


@click.command(name="check")
@PROJECT_OPTION
@click.option(
    "--check-stale", is_flag=True, help="Also fail on entries nothing reports any more."
)
def baseline_check_command(project: Path, check_stale: bool) -> None:
    """Fail on new findings, and on stale debt when asked."""
    root, result = checked_project(project)
    classified = classify_findings(
        result.findings, read_baseline(root / BASELINE_FILENAME)
    )
    click.echo(
        f"{len(classified.new)} new, {len(classified.known)} known, "
        f"{len(classified.resolved)} resolved"
    )
    for finding in classified.new:
        click.echo(
            f"{finding.location.path}:{finding.location.line}: "
            f"{finding.code.value} {finding.message}"
        )
    sys.exit(
        ExitCode.FINDINGS
        if classified.new or (check_stale and classified.resolved)
        else ExitCode.OK
    )
