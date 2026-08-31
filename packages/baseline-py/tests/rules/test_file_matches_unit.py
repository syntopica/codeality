"""BPY002 applies to ordinary modules holding exactly one declaration."""

from baseline_py.config.module_role import ModuleRole
from baseline_py.rules.file_matches_unit import file_matches_unit

_CLASS = "class UserRepository:\n    pass\n"


def test_a_matching_name_is_clean(make_source, config) -> None:
    source = make_source(_CLASS, "src/pkg/user_repository.py")
    assert file_matches_unit(source, config) == ()


def test_a_mismatched_name_is_reported(make_source, config) -> None:
    findings = file_matches_unit(make_source(_CLASS, "src/pkg/repo.py"), config)
    assert len(findings) == 1
    assert "user_repository.py" in findings[0].message


def test_a_function_module_matches_its_function(make_source, config) -> None:
    source = make_source(
        "def parse_date() -> None:\n    return None\n", "src/pkg/parse_date.py"
    )
    assert file_matches_unit(source, config) == ()


def test_a_multi_declaration_module_is_left_to_bpy001(make_source, config) -> None:
    body = "class A:\n    pass\n\n\nclass B:\n    pass\n"
    assert file_matches_unit(make_source(body, "src/pkg/things.py"), config) == ()


def test_entrypoint_barrel_test_and_generated_roles_are_exempt(
    make_source, config
) -> None:
    for role in (
        ModuleRole.ENTRYPOINT,
        ModuleRole.BARREL,
        ModuleRole.TEST,
        ModuleRole.GENERATED,
        ModuleRole.DATA,
        ModuleRole.REGISTRY,
        ModuleRole.STUB,
    ):
        source = make_source(_CLASS, "src/pkg/anything.py", role)
        assert file_matches_unit(source, config) == ()
