"""Judge a data module against the one-unit rule."""

from baseline_py.model.finding import Finding
from baseline_py.rules.unit_finding import unit_finding
from baseline_py.units.declaration import Declaration

DATA_DECLARES = "a data module declares no class, function or type alias"


def data_unit_findings(
    relative_path: str, declarations: tuple[Declaration, ...]
) -> tuple[Finding, ...]:
    """Return a finding when a data module declares anything at all."""
    if not declarations:
        return ()
    return (unit_finding(relative_path, DATA_DECLARES, declarations[0].name, ()),)
