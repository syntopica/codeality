"""gate refuses a bad configuration before running any stage."""

from pathlib import Path

import pytest
from click.testing import CliRunner

from codeality_py.cli import cli


def test_a_bad_budget_variable_is_a_configuration_error_not_a_crash(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "src").mkdir()
    monkeypatch.setenv("CODEALITY_PY_TEST_BUDGET_SECONDS", "ten minutes")
    result = CliRunner().invoke(cli, ["gate", "--project", str(tmp_path)])
    assert result.exit_code == 2
    assert result.exception is None or isinstance(result.exception, SystemExit)
    assert "configuration error: CODEALITY_PY_TEST_BUDGET_SECONDS" in result.output
