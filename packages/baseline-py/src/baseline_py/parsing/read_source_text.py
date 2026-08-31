"""Read a source file with the encoding it declares."""

import tokenize
from pathlib import Path

from baseline_py.parsing.infrastructure_error import InfrastructureError


def read_source_text(path: Path, relative_path: str) -> str:
    """Return the decoded file text, or raise an infrastructure error."""
    try:
        with path.open("rb") as handle:
            encoding, _ = tokenize.detect_encoding(handle.readline)
        return path.read_text(encoding=encoding)
    except (OSError, SyntaxError, UnicodeDecodeError, LookupError) as error:
        raise InfrastructureError(
            f"{relative_path} could not be read: {error}"
        ) from error
