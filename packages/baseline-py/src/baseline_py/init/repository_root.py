"""Find the repository a project lives in."""

from pathlib import Path


def repository_root(project_root: Path) -> Path:
    """Return the nearest ancestor holding ``.git``, or the project itself.

    A project is often nested inside a repository about something else, and
    GitHub reads workflows only from that repository's root.
    """
    for directory in (project_root, *project_root.parents):
        if (directory / ".git").exists():
            return directory
    return project_root
