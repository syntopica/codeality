"""Render the gate outcome for a terminal or for a machine."""

import json

from baseline_py.gate.gate_result import GateResult
from baseline_py.report.stage_document import stage_document


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
        for stage in result.stages
    )
