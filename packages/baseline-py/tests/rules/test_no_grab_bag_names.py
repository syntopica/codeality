"""BPY003 matches whole path segments, case-insensitively."""

from baseline_py.config.module_role import ModuleRole
from baseline_py.rules.no_grab_bag_names import no_grab_bag_names


def test_a_grab_bag_file_stem_is_reported(make_source, config) -> None:
    findings = no_grab_bag_names(make_source("x = 1\n", "src/pkg/utils.py"), config)
    assert len(findings) == 1
    assert findings[0].subject == "utils"


def test_a_grab_bag_package_segment_is_reported(make_source, config) -> None:
    findings = no_grab_bag_names(make_source("x = 1\n", "src/pkg/helpers/parse.py"), config)
    assert len(findings) == 1


def test_matching_is_case_insensitive(make_source, config) -> None:
    assert no_grab_bag_names(make_source("x = 1\n", "src/Utils/parse.py"), config)


def test_substrings_are_not_matched(make_source, config) -> None:
    assert no_grab_bag_names(make_source("x = 1\n", "src/pkg/utils_for_dates.py"), config) == ()
    assert no_grab_bag_names(make_source("x = 1\n", "src/pkg/date_utilities.py"), config) == ()


def test_an_ordinary_module_is_not_reported(make_source, config) -> None:
    assert no_grab_bag_names(make_source("x = 1\n", "src/pkg/parse_date.py"), config) == ()


def test_tests_are_not_exempt(make_source, config) -> None:
    source = make_source("x = 1\n", "tests/helpers.py", ModuleRole.TEST)
    assert no_grab_bag_names(source, config)


def test_stub_files_lose_their_suffix_before_matching(make_source, config) -> None:
    assert no_grab_bag_names(make_source("x = 1\n", "src/pkg/common.pyi", ModuleRole.STUB), config)
