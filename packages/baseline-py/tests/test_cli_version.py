"""The CLI reports the installed distribution version."""

from click.testing import CliRunner

from baseline_py.cli import cli


def test_cli_reports_its_version() -> None:
    result = CliRunner().invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "baseline-py" in result.output
