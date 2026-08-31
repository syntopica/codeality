"""How current findings relate to the recorded baseline."""

from dataclasses import dataclass

from baseline_py.model.finding import Finding


@dataclass(frozen=True, slots=True)
class ClassifiedFindings:
    """New findings block; known ones are tracked debt; resolved ones are stale."""

    new: tuple[Finding, ...]
    known: tuple[Finding, ...]
    resolved: tuple[str, ...]
