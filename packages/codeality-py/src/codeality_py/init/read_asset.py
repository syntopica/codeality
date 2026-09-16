"""Read one shipped configuration asset."""

from importlib.resources import files


def read_asset(name: str) -> str:
    """Return the text of a bundled asset, by file name."""
    return (files("codeality_py") / "assets" / name).read_text(encoding="utf-8")
