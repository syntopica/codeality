"""Configuration is validated strictly; a typo never falls back to defaults."""

from pathlib import Path

import pytest

from baseline_py.config.config_error import ConfigError
from baseline_py.config.load_config import load_config
from baseline_py.config.module_role import ModuleRole


def _write(tmp_path: Path, body: str) -> Path:
    (tmp_path / "baseline-py.toml").write_text(body, encoding="utf-8")
    return tmp_path


def test_defaults_apply_when_no_config_file_exists(tmp_path: Path) -> None:
    (tmp_path / "src").mkdir()
    config = load_config(tmp_path)
    assert config.limits.max_file_lines == 150
    assert config.limits.test_max_file_lines == 300
    assert config.source_roots == ("src",)
    assert config.respect_gitignore is True


def test_source_roots_fall_back_to_top_level_packages(tmp_path: Path) -> None:
    package = tmp_path / "atrium"
    package.mkdir()
    (package / "__init__.py").write_text("", encoding="utf-8")
    assert load_config(tmp_path).source_roots == ("atrium",)


def test_unknown_top_level_key_is_fatal(tmp_path: Path) -> None:
    _write(tmp_path, "schema-version = 1\nmax_file_lines = 150\n")
    with pytest.raises(ConfigError, match="unknown key"):
        load_config(tmp_path)


def test_unknown_limits_key_is_fatal(tmp_path: Path) -> None:
    _write(tmp_path, "schema-version = 1\n[limits]\nmaxfilelines = 10\n")
    with pytest.raises(ConfigError, match=r"\[limits\]"):
        load_config(tmp_path)


def test_unsupported_schema_version_is_fatal(tmp_path: Path) -> None:
    _write(tmp_path, "schema-version = 99\n")
    with pytest.raises(ConfigError, match="schema-version"):
        load_config(tmp_path)


def test_a_missing_schema_version_is_fatal(tmp_path: Path) -> None:
    _write(tmp_path, "respect-gitignore = false\n")
    with pytest.raises(ConfigError, match="schema-version"):
        load_config(tmp_path)


def test_a_file_claimed_by_two_roles_is_fatal(tmp_path: Path) -> None:
    _write(
        tmp_path,
        'schema-version = 1\n[roles]\ndata = ["src/a.py"]\nregistry = ["src/a.py"]\n',
    )
    with pytest.raises(ConfigError, match="claimed by"):
        load_config(tmp_path)


def test_roles_are_read_and_merged_with_generated_defaults(tmp_path: Path) -> None:
    _write(tmp_path, 'schema-version = 1\n[roles]\ndata = ["src/constants.py"]\n')
    config = load_config(tmp_path)
    assert config.roles[ModuleRole.DATA] == ("src/constants.py",)
    assert "**/*_pb2.py" in config.roles[ModuleRole.GENERATED]


def test_a_broad_override_requires_a_reason(tmp_path: Path) -> None:
    _write(
        tmp_path,
        'schema-version = 1\n[[overrides]]\npaths = ["legacy/**"]\ndisable = ["BPY001"]\n',
    )
    with pytest.raises(ConfigError, match="reason"):
        load_config(tmp_path)


def test_an_unknown_rule_code_in_an_override_is_fatal(tmp_path: Path) -> None:
    _write(
        tmp_path,
        'schema-version = 1\n[[overrides]]\npaths = ["a.py"]\ndisable = ["BPY999"]\n',
    )
    with pytest.raises(ConfigError, match="unknown rule code"):
        load_config(tmp_path)
