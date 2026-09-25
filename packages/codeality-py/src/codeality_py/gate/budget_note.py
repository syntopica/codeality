"""Say which time budget a stage was held to, and where it came from."""


def budget_note(budget_seconds: float, budget_source: str) -> str:
    """Return ``budget 600s from <source>``, or nothing for an unbudgeted stage.

    The budget can come from the configuration file or from an environment
    variable that overrides it on one machine, so a log that shows only the
    number leaves the reader guessing which of the two was in force.
    """
    if budget_seconds <= 0.0:
        return ""
    return f"budget {budget_seconds:g}s from {budget_source}"
