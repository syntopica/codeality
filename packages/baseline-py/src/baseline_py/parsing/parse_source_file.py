"""Read and parse one file, never skipping a failure silently."""

import ast
from pathlib import Path

from baseline_py.config.module_role import ModuleRole
from baseline_py.parsing.infrastructure_error import InfrastructureError
from baseline_py.parsing.read_source_text import read_source_text
from baseline_py.parsing.source_file import SourceFile
from baseline_py.parsing.syntax_error_finding import syntax_error_finding


def parse_source_file(path: Path, relative_path: str, role: ModuleRole) -> SourceFile:
    """Return the parsed file.

    A syntax error becomes a BPY000 finding. An unreadable file or a parser
    that cannot handle the runtime raises InfrastructureError, so a broken
    environment can never look like a clean run.
    """
    text = read_source_text(path, relative_path)
    try:
        tree = ast.parse(text, filename=relative_path)
    except SyntaxError as error:
        return SourceFile(
            relative_path=relative_path,
            role=role,
            text=text,
            parse_error=syntax_error_finding(relative_path, error),
        )
    except (RecursionError, ValueError, MemoryError) as error:
        raise InfrastructureError(f"{relative_path} could not be parsed: {error}") from error
    return SourceFile(relative_path=relative_path, role=role, text=text, tree=tree)
