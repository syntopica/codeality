"""Render findings as the frozen machine-readable document."""

import json
from importlib.metadata import version

from baseline_py.engine.check_result import CheckResult
from baseline_py.report.finding_document import finding_document
from baseline_py.report.findings_summary import findings_summary

SCHEMA_VERSION = 1


def render_json_report(result: CheckResult) -> str:
    """Return the versioned JSON document. Only this goes to stdout."""
    document = {
        "schema_version": SCHEMA_VERSION,
        "tool": {"name": "baseline-py", "version": version("busirocket-baseline-py")},
        "roots": list(result.scanned_roots),
        "scanned_files": result.scanned_files,
        "findings": [finding_document(finding) for finding in result.findings],
        "warnings": list(result.warnings),
        "summary": findings_summary(result.findings),
    }
    return json.dumps(document, indent=2, sort_keys=False)
