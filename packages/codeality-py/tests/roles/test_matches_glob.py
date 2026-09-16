"""A glob's * stops at a directory separator; ** crosses it."""

import pytest

from codeality_py.roles.matches_glob import matches_glob

MATCHING = [
    ("script.py", "*.py"),
    ("pkg/module.py", "pkg/*.py"),
    ("pkg/sub/module.py", "pkg/**/*.py"),
    ("pkg/module_pb2.py", "**/*_pb2.py"),
    ("module_pb2.py", "**/*_pb2.py"),
    ("src/pkg/routes/users.py", "src/pkg/routes/*.py"),
    ("legacy/deep/thing.py", "legacy/**"),
]

NOT_MATCHING = [
    ("pkg/module.py", "*.py"),
    ("pkg/sub/module.py", "pkg/*.py"),
    ("other/module.py", "pkg/**/*.py"),
    ("src/pkg/routes/deep/users.py", "src/pkg/routes/*.py"),
]


@pytest.mark.parametrize(("path", "pattern"), MATCHING)
def test_matching(path: str, pattern: str) -> None:
    assert matches_glob(path, pattern)


@pytest.mark.parametrize(("path", "pattern"), NOT_MATCHING)
def test_not_matching(path: str, pattern: str) -> None:
    assert not matches_glob(path, pattern)


def test_a_root_only_pattern_does_not_claim_the_whole_tree() -> None:
    """The consumer-a case: entrypoint = ["*.py"] meant the 40 root scripts."""
    assert matches_glob("autoclean.py", "*.py")
    assert not matches_glob("facturas/invoice.py", "*.py")
