"""Read and parse one file, never skipping a failure silently."""

import ast
import tokenize
from pathlib import Path

from baseline_py.config.module_role import ModuleRole
from baseline_py.model.finding import Finding
from baseline_py.model.location import Location
from baseline_py.model.rule_code import RuleCode
from baseline_py.model.severity import Severity
from baseline_py.parsing.infrastructure_error import InfrastructureError
from baseline_py.parsing.source_file import SourceFile


def parse_source_file(path: Path, relative_path: str, role: ModuleRole) -> SourceFile:
    """Return the parsed file.

    A syntax error becomes a BPY000 finding. An unreadable file or a parser
    that cannot handle the runtime raises InfrastructureError, so a broken
    environment can never look like a clean run.
    """
    text = _read_text(path, relative_path)
    try:
        tree = ast.parse(text, filename=relative_path)
    except SyntaxError as error:
        return SourceFile(
            relative_path=relative_path,
            role=role,
            text=text,
            parse_error=_syntax_finding(relative_path, error),
        )
    except (RecursionError, ValueError, MemoryError) as error:
        raise InfrastructureError(f"{relative_path} could not be parsed: {error}") from error
    return SourceFile(relative_path=relative_path, role=role, text=text, tree=tree)


def _read_text(path: Path, relative_path: str) -> str:
    try:
        with path.open("rb") as handle:
            encoding, _ = tokenize.detect_encoding(handle.readline)
        return path.read_text(encoding=encoding)
    except (OSError, SyntaxError, UnicodeDecodeError, LookupError) as error:
        raise InfrastructureError(f"{relative_path} could not be read: {error}") from error


def _syntax_finding(relative_path: str, error: SyntaxError) -> Finding:
    return Finding(
        code=RuleCode.BPY000,
        severity=Severity.ERROR,
        message=f"file does not parse: {error.msg}",
        location=Location(path=relative_path, line=error.lineno or 1, column=error.offset or 1),
    )
