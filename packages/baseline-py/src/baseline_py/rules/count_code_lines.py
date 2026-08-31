"""Count the lines that carry code."""

import io
import tokenize

from baseline_py.parsing.source_file import SourceFile
from baseline_py.rules.docstring_line_spans import docstring_line_spans


def count_code_lines(source: SourceFile) -> int:
    """Return the occupied, non-comment, non-docstring line count.

    Decorators count. Every physical line of a multiline string assigned as
    data counts, because that is code that has to be read.
    """
    if source.tree is None:
        return len(source.text.splitlines())
    skipped = docstring_line_spans(source.tree)
    occupied: set[int] = set()
    tokens = tokenize.generate_tokens(io.StringIO(source.text).readline)
    for token in tokens:
        if token.type in (tokenize.COMMENT, tokenize.NL, tokenize.NEWLINE):
            continue
        if token.type in (tokenize.INDENT, tokenize.DEDENT, tokenize.ENDMARKER):
            continue
        if not token.string.strip():
            continue
        occupied.update(range(token.start[0], token.end[0] + 1))
    return len(occupied - skipped)
