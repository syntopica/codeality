"""The stages the gate runs, in order."""

from codeality_py.baseline.baseline_file import BASELINE_FILENAME
from codeality_py.config.baseline_config import BaselineConfig
from codeality_py.gate.stage import Stage
from codeality_py.gate.stage_kind import StageKind


def gate_stages(config: BaselineConfig) -> tuple[Stage, ...]:
    """Return the ordered stages for this project.

    Coverage is collected rather than merely configured. pip-audit audits the
    installed environment, which the CI workflow builds with "uv sync
    --locked", so what is audited is exactly what the lockfile pins.

    pytest reports its slowest tests every run, so a suite that goes over its
    budget hands the reader the measurement in the same output, and a suite
    creeping towards it is visible before it gets there.
    """
    roots = [*config.source_roots, *config.test_roots]
    package = config.import_package or config.source_roots[0]
    # A recorded baseline is the migration plan; the gate must honor it, or
    # recording debt could never turn the gate green.
    structural = (
        ("codeality-py", "baseline", "check")
        if (config.project_root / BASELINE_FILENAME).is_file()
        else ("codeality-py", "check")
    )
    return (
        Stage("ruff", StageKind.REQUIRED, ("ruff", "check", *roots)),
        Stage("ruff-format", StageKind.REQUIRED, ("ruff", "format", "--check", *roots)),
        Stage("mypy", StageKind.REQUIRED, ("mypy", *config.source_roots)),
        Stage("codeality-py", StageKind.REQUIRED, structural),
        Stage("deptry", StageKind.REQUIRED, ("deptry", ".")),
        Stage(
            "pip-audit",
            StageKind.REQUIRED,
            (
                "pip-audit",
                *(part for vuln in config.audit_ignore_vulns for part in ("--ignore-vuln", vuln)),
            ),
        ),
        Stage(
            "pytest",
            StageKind.REQUIRED,
            (
                "pytest",
                f"--cov={package}",
                "--cov-report=term-missing",
                f"--cov-fail-under={config.coverage_threshold}",
                "--durations=10",
            ),
            budget_seconds=float(config.test_budget_seconds),
        ),
        Stage("pyrefly", StageKind.SHADOW, ("pyrefly", "check")),
    )
