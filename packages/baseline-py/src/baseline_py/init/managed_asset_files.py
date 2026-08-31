"""The standalone files init writes into a project."""

ASSET_TARGETS: tuple[tuple[str, str], ...] = (
    ("baseline-py.toml", "baseline-py.toml"),
    ("mypy.ini", "mypy.ini"),
)
CI_ASSET: tuple[str, str] = ("baseline-py-ci.yml", ".github/workflows/quality.yml")
IMPORT_LINTER_ASSET: tuple[str, str] = ("importlinter.ini", ".importlinter")
RUFF_ASSET: tuple[str, str] = ("ruff.toml", "ruff.toml")
