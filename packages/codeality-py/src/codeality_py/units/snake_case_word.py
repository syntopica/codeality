"""Convert one underscore-free word of a declaration name to snake_case."""

import re

from codeality_py.units.merge_stray_letters import merge_stray_letters

_PLURAL_ACRONYM = re.compile(r"([A-Z]{2,})s(?=[A-Z0-9]|$)")
_ACRONYM_THEN_WORD = re.compile(r"([A-Z]+)([A-Z][a-z])")
_WORD_THEN_CAPITAL = re.compile(r"([a-z0-9])([A-Z])")


def snake_case_word(word: str) -> str:
    """Return the snake_case form of a word holding no underscore.

    A plural acronym (URLs, IDs) is one word, so it is marked off before the
    case-boundary split would cut it into ur and ls.
    """
    separated = _PLURAL_ACRONYM.sub(lambda match: f"_{match.group(1).lower()}s_", word)
    separated = _ACRONYM_THEN_WORD.sub(r"\1_\2", separated)
    separated = _WORD_THEN_CAPITAL.sub(r"\1_\2", separated)
    segments = [segment for segment in separated.lower().split("_") if segment]
    return "_".join(merge_stray_letters(segments)) if segments else word.lower()
