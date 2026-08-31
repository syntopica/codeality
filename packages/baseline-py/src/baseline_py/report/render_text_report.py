"""Render findings the way a terminal reader wants them."""

from baseline_py.engine.check_result import CheckResult


def render_text_report(result: CheckResult) -> str:
    """Return one line per finding, then a summary naming what was scanned."""
    lines = [
        f"{finding.location.path}:{finding.location.line}:{finding.location.column}: "
        f"{finding.code.value} {finding.code.slug}: {finding.message}"
        for finding in result.findings
    ]
    lines.extend(f"warning: {warning}" for warning in result.warnings)
    roots = ", ".join(result.scanned_roots)
    lines.append(
        f"{len(result.findings)} findings in {result.scanned_files} files under {roots}"
    )
    return "\n".join(lines)
