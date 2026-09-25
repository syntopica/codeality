"""Render the gate outcome for a terminal or for a machine."""

import json

from codeality_py.gate.budget_note import budget_note
from codeality_py.gate.gate_result import GateResult
from codeality_py.report.stage_document import stage_document


def render_gate_report(result: GateResult, as_json: bool) -> str:
    """Return the per-stage summary, in text or as the JSON document."""
    if as_json:
        document = {
            "schema_version": 1,
            "stages": [stage_document(stage) for stage in result.stages],
        }
        return json.dumps(document, indent=2)
    return "\n".join(
        f"{stage.status.value:>22}  {stage.name:<12} "
        f"{stage.duration_seconds:>7.2f}s  {' '.join(stage.command)}"
        + (
            f"  [{note}]"
            if (note := budget_note(stage.budget_seconds, stage.budget_source))
            else ""
        )
        for stage in result.stages
    )
