"""Where a scaffolded workflow goes, relative to the project."""

import os
from pathlib import Path

from baseline_py.init.managed_asset_files import CI_ASSET
from baseline_py.init.repository_root import repository_root


def workflow_target(project_root: Path) -> str:
    """Return where the workflow goes, relative to the project.

    GitHub reads workflows only from the repository root. A nested project's
    workflow lives there, named after the project so two nested projects do
    not fight over one file.
    """
    repository = repository_root(project_root)
    if repository == project_root:
        return CI_ASSET[1]
    target = repository / ".github" / "workflows" / f"quality-{project_root.name}.yml"
    return os.path.relpath(target, project_root)
