"""Point a scaffolded workflow at a project nested inside its repository."""

from pathlib import PurePosixPath

_RUNS_ON = "    runs-on: ubuntu-latest\n"


def render_nested_workflow(content: str, relative: PurePosixPath) -> str:
    """Return the workflow with every step running from ``relative``.

    GitHub only reads ``.github/workflows`` at the repository root, so a
    nested project's workflow lives there and changes directory itself. The
    artifact path is resolved against the workspace, not the step's
    directory, so it is prefixed too.
    """
    defaults = (
        "    # The project lives inside a repository about something else; GitHub\n"
        "    # only reads workflows at the repository root, so every step runs\n"
        "    # from the project directory.\n"
        "    defaults:\n"
        "      run:\n"
        f"        working-directory: {relative}\n"
    )
    rendered = content.replace(_RUNS_ON, _RUNS_ON + defaults, 1)
    return rendered.replace("path: pyrefly.json", f"path: {relative}/pyrefly.json")
