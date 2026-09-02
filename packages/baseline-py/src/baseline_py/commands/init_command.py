"""The ``init`` command: plan by default, merge on request, never shadow."""

import sys
from pathlib import Path

import click

from baseline_py.init.apply_init import apply_init
from baseline_py.init.plan_disposition import PlanDisposition
from baseline_py.init.plan_init import plan_init
from baseline_py.report.exit_code import ExitCode


@click.command(name="init")
@click.option(
    "--project",
    type=click.Path(file_okay=False, exists=True, path_type=Path),
    default=Path(),
    help="Project root to scaffold. Defaults to the working directory.",
)
@click.option("--check", "check_only", is_flag=True, help="Plan only; exit 2 on any conflict.")
@click.option("--apply", "should_apply", is_flag=True, help="Write creates and merges.")
@click.option("--force", is_flag=True, help="Also replace conflicting managed files.")
@click.option("--ci", "with_ci", is_flag=True, help="Also scaffold the CI workflow.")
@click.option(
    "--profile",
    type=click.Choice(["lib", "app"]),
    default="lib",
    help="app additionally scaffolds an import-linter contract.",
)
def init_command(  # noqa: PLR0913, PLR0917 - one parameter per click option
    project: Path,
    check_only: bool,
    should_apply: bool,
    force: bool,
    with_ci: bool,
    profile: str,
) -> None:
    """Scaffold the quality configuration by merging, never by shadowing."""
    root = project.resolve()
    plan = plan_init(root, profile, with_ci)
    for managed in plan:
        # A nested project's workflow lives at the repository root, outside it.
        path = managed.path.resolve()
        shown = path.relative_to(root) if path.is_relative_to(root) else path
        click.echo(f"{managed.disposition.value:>9}  {shown}  ({managed.detail})")
    if should_apply or force:
        written = apply_init(plan, force)
        click.echo(f"wrote {len(written)} files")
    conflicts = [item for item in plan if item.disposition is PlanDisposition.CONFLICT]
    if conflicts and check_only:
        sys.exit(ExitCode.CONFIGURATION)
    sys.exit(ExitCode.OK)
