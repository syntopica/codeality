"""One reported rule violation."""

from dataclasses import dataclass, field

from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity


@dataclass(frozen=True, slots=True)
class Finding:
    """A rule violation, ordered by path, then position, then rule code."""

    code: RuleCode
    severity: Severity
    message: str
    location: Location
    subject: str | None = None
    related: tuple[Location, ...] = ()
    fingerprint: str = ""
    baseline_state: str = "new"

    def sort_key(self) -> tuple[str, int, int, str]:
        """Return the deterministic ordering key used by every renderer."""
        return (self.location.path, self.location.line, self.location.column, self.code.value)

    def __lt__(self, other: "Finding") -> bool:
        """Order findings by path, then position, then rule code."""
        return self.sort_key() < other.sort_key()
