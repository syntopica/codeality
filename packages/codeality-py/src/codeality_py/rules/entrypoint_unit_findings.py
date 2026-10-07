"""Judge an entrypoint module against the one-unit rule."""

from codeality_py.model.finding import Finding
from codeality_py.rules.ordinary_unit_findings import ordinary_unit_findings
from codeality_py.units.declaration import Declaration


def entrypoint_unit_findings(
    relative_path: str, declarations: tuple[Declaration, ...]
) -> tuple[Finding, ...]:
    """Return the finding for an entrypoint module, or nothing when it is clean.

    An entrypoint may declare nothing: a ``__main__.py`` that imports the entry
    function and calls it under the ``__main__`` guard is the shape the role
    exists for. Otherwise it holds its one unit, like an ordinary module.
    """
    if not declarations:
        return ()
    return ordinary_unit_findings(relative_path, declarations)
