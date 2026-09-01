"""Read the branch a project is checked out on."""

from pathlib import Path

_REF_PREFIX = "ref: refs/heads/"


def current_branch(project_root: Path) -> str | None:
    """Return the checked-out branch, or None when it cannot be read.

    Walks up to the enclosing repository, since a project is often nested
    inside one that is about something else. A detached HEAD, a worktree
    whose ``.git`` is a file, or no repository at all answer None.
    """
    for directory in (project_root, *project_root.parents):
        head = directory / ".git" / "HEAD"
        if not head.is_file():
            continue
        try:
            text = head.read_text(encoding="utf-8").strip()
        except OSError:
            return None
        return text.removeprefix(_REF_PREFIX) if text.startswith(_REF_PREFIX) else None
    return None
