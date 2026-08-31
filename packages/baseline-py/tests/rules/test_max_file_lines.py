"""BPY004 counts code lines, not physical lines."""

from baseline_py.config.baseline_config import BaselineConfig
from baseline_py.config.limits import Limits
from baseline_py.config.module_role import ModuleRole
from baseline_py.rules.count_code_lines import count_code_lines
from baseline_py.rules.max_file_lines import max_file_lines


def test_blank_and_comment_lines_do_not_count(make_source) -> None:
    body = "x = 1\n\n# a comment\n\ny = 2\n"
    assert count_code_lines(make_source(body)) == 2


def test_module_and_function_docstrings_do_not_count(make_source) -> None:
    body = '"""Module.\n\nLong.\n"""\n\n\ndef run() -> None:\n    """Do it."""\n    return None\n'
    assert count_code_lines(make_source(body)) == 2


def test_a_multiline_string_assigned_as_data_counts(make_source) -> None:
    body = 'TEMPLATE = """\nline one\nline two\n"""\n'
    assert count_code_lines(make_source(body)) == 4


def test_decorator_lines_count(make_source) -> None:
    body = "import click\n\n\n@click.command()\ndef run() -> None:\n    return None\n"
    assert count_code_lines(make_source(body)) == 4


def test_a_file_within_the_cap_is_not_reported(make_source, config) -> None:
    assert max_file_lines(make_source("x = 1\n"), config) == ()


def test_a_file_over_the_cap_is_reported(make_source) -> None:
    config = BaselineConfig(project_root=None, limits=Limits(max_file_lines=2))  # type: ignore[arg-type]
    findings = max_file_lines(make_source("a = 1\nb = 2\nc = 3\n"), config)
    assert len(findings) == 1
    assert "over the cap of 2" in findings[0].message


def test_tests_use_the_looser_test_cap(make_source) -> None:
    config = BaselineConfig(  # type: ignore[arg-type]
        project_root=None, limits=Limits(max_file_lines=1, test_max_file_lines=10)
    )
    source = make_source("a = 1\nb = 2\n", "tests/test_unit.py", ModuleRole.TEST)
    assert max_file_lines(source, config) == ()


def test_generated_and_stub_roles_are_exempt(make_source) -> None:
    config = BaselineConfig(project_root=None, limits=Limits(max_file_lines=1))  # type: ignore[arg-type]
    for role in (ModuleRole.GENERATED, ModuleRole.STUB, ModuleRole.EXCLUDED):
        source = make_source("a = 1\nb = 2\n", "src/pkg/unit.py", role)
        assert max_file_lines(source, config) == ()
