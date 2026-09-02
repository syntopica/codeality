"""BPY006 matches SQL by token shape, never by substring."""

from baseline_py.config.module_role import ModuleRole
from baseline_py.rules.looks_like_sql import looks_like_sql
from baseline_py.rules.no_inline_sql import no_inline_sql


def test_prose_containing_select_is_not_sql() -> None:
    assert not looks_like_sql("Select an option from the menu below")


def test_a_real_query_is_sql() -> None:
    assert looks_like_sql("SELECT id, name FROM users WHERE id = ?")


def test_case_and_whitespace_are_normalised() -> None:
    assert looks_like_sql("select\n  id\nfrom\n  users")


def test_the_four_statement_shapes_are_recognised() -> None:
    assert looks_like_sql("INSERT INTO users (id) VALUES (?)")
    assert looks_like_sql("UPDATE users SET name = ?")
    assert looks_like_sql("DELETE FROM users WHERE id = ?")
    assert looks_like_sql("CREATE TABLE users (id INTEGER)")


def test_a_query_in_a_module_is_reported(make_source, config) -> None:
    body = 'QUERY = "SELECT id FROM users"\n\n\ndef run() -> str:\n    return QUERY\n'
    findings = no_inline_sql(make_source(body), config)
    assert len(findings) == 1
    assert findings[0].location.line == 1


def test_an_fstring_query_is_reported(make_source, config) -> None:
    body = 'def run(table: str) -> str:\n    return f"SELECT id FROM {table}"\n'
    assert no_inline_sql(make_source(body), config)


def test_implicitly_concatenated_parts_are_joined_before_matching(make_source, config) -> None:
    body = 'QUERY = (\n    "SELECT id "\n    "FROM users"\n)\n'
    assert no_inline_sql(make_source(body), config)


def test_a_docstring_is_never_reported(make_source, config) -> None:
    body = '"""Load users.\n\nRuns SELECT id FROM users under the hood.\n"""\n'
    assert no_inline_sql(make_source(body), config) == ()


def test_generated_and_stub_roles_are_exempt(make_source, config) -> None:
    body = 'QUERY = "SELECT id FROM users"\n'
    for role in (ModuleRole.GENERATED, ModuleRole.STUB, ModuleRole.EXCLUDED):
        assert no_inline_sql(make_source(body, "src/pkg/unit.py", role), config) == ()


def test_tests_are_not_exempt(make_source, config) -> None:
    body = 'QUERY = "SELECT id FROM users"\n'
    source = make_source(body, "tests/test_store.py", ModuleRole.TEST)
    assert no_inline_sql(source, config)


def test_a_multiline_fstring_query_is_one_finding(make_source, config) -> None:
    body = (
        "def run(table: str) -> str:\n"
        '    return f"""\n'
        "        SELECT id, name\n"
        "        FROM {table}\n"
        "        WHERE id > 0\n"
        '    """\n'
    )
    findings = no_inline_sql(make_source(body), config)
    assert [finding.location.line for finding in findings] == [2]
