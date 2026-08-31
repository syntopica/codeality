"""The command-line entry point prints a greeting."""

import sys

import pytest

from greeting_service.cli import cli


def test_the_cli_greets_the_name_it_is_given(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(sys, "argv", ["greeting-service", "baseline"])
    cli()
    assert capsys.readouterr().out == "Hello, baseline!\n"


def test_the_cli_falls_back_to_world(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(sys, "argv", ["greeting-service"])
    cli()
    assert capsys.readouterr().out == "Hello, world!\n"
