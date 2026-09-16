"""The CLI reports the installed distribution version."""

from click.testing import CliRunner

from codeality_py.cli import cli


def test_cli_reports_its_version() -> None:
    result = CliRunner().invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "codeality-py" in result.output
