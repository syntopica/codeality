"""The stage commands say exactly what they run."""

from pathlib import Path

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.gate.gate_stages import gate_stages


def _commands(config: BaselineConfig) -> dict[str, tuple[str, ...]]:
    return {stage.name: stage.command for stage in gate_stages(config)}


def test_coverage_is_collected_not_merely_configured() -> None:
    config = BaselineConfig(
        project_root=Path("/p"), import_package="demo", coverage_threshold=80
    )
    pytest_command = _commands(config)["pytest"]
    assert "--cov=demo" in pytest_command
    assert "--cov-fail-under=80" in pytest_command


def test_pip_audit_audits_the_synced_environment() -> None:
    """CI syncs from the lockfile first, so the environment is the lockfile."""
    config = BaselineConfig(project_root=Path("/p"))
    assert _commands(config)["pip-audit"] == ("pip-audit",)


def test_pyrefly_is_a_shadow_stage() -> None:
    config = BaselineConfig(project_root=Path("/p"))
    shadow = [stage for stage in gate_stages(config) if stage.kind.value == "shadow"]
    assert [stage.name for stage in shadow] == ["pyrefly"]
