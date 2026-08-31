"""Render one gate stage as its JSON object."""

from baseline_py.gate.stage_result import StageResult


def stage_document(stage: StageResult) -> dict[str, object]:
    """Return the machine-readable record of one stage."""
    return {
        "name": stage.name,
        "kind": stage.kind.value,
        "command": list(stage.command),
        "status": stage.status.value,
        "exit_code": stage.exit_code,
        "duration_seconds": stage.duration_seconds,
        "detail": stage.detail,
    }
