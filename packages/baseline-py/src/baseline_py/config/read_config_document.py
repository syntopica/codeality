"""Read baseline-py.toml into a plain mapping."""

import tomllib
from pathlib import Path
from typing import Any

from baseline_py.config.config_error import ConfigError


def read_config_document(path: Path) -> dict[str, Any]:
    """Return the parsed document, or an empty one when the file is absent."""
    if not path.is_file():
        return {}
    try:
        return tomllib.loads(path.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, OSError, UnicodeDecodeError) as error:
        raise ConfigError(f"{path.name} could not be read: {error}") from error
