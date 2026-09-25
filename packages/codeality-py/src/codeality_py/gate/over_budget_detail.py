"""What the report says about a stage that passed too slowly."""

from codeality_py.gate.stage import Stage

# The suite-time procedure: profile the slowest tests, make the unit under
# test cheaper, then parallelise, then serialise what must stay shared.
PROCEDURE_URL = (
    "https://github.com/syntopica/codeality/blob/main/docs/standards/testing.md#suite-time-budget"
)


def over_budget_detail(stage: Stage, elapsed: float, output: str) -> str:
    """Return the detail for a stage that succeeded past its budget.

    It carries the last part of the stage's own output, which for pytest run
    with ``--durations`` is the table of the slowest tests, so the reader
    starts from the measurement rather than from the exit code.
    """
    header = (
        f"{stage.name} passed in {elapsed:.1f}s, over its budget of "
        f"{stage.budget_seconds:g}s (from {stage.budget_source}). "
        f"Profile before adding hardware: {PROCEDURE_URL}"
    )
    tail = output[-2000:].strip()
    return f"{header}\n{tail}" if tail else header
