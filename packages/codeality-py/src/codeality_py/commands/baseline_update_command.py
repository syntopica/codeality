"""Record every current finding as accepted debt."""

from importlib.metadata import version
from pathlib import Path

import click

from codeality_py.baseline.baseline_file import BASELINE_FILENAME, BaselineFile
from codeality_py.baseline.write_baseline import write_baseline
from codeality_py.commands.checked_project import checked_project
from codeality_py.commands.project_option import PROJECT_OPTION


@click.command(name="update")
@PROJECT_OPTION
def baseline_update_command(project: Path) -> None:
    """Write the baseline. This and nothing else records debt."""
    root, result = checked_project(project)
    recorded = BaselineFile(
        entries=frozenset(finding.fingerprint for finding in result.findings),
        tool_version=version("syntopica-codeality-py"),
    )
    write_baseline(root / BASELINE_FILENAME, recorded)
    click.echo(f"recorded {len(recorded.entries)} findings as baseline debt")
