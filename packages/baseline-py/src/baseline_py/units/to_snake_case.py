"""Convert a declaration name to the file name that must hold it."""

import re

_ACRONYM_THEN_WORD = re.compile(r"([A-Z]+)([A-Z][a-z])")
_WORD_THEN_CAPITAL = re.compile(r"([a-z0-9])([A-Z])")


def to_snake_case(name: str) -> str:
    """Return the snake_case form of a declaration name.

    One algorithm, pinned by fixtures. Splitting on the two case boundaries
    leaves a stray single letter in names such as ``OAuthClient`` and
    ``IPv6Address``, so a one-character segment is merged into the segment
    that follows it: oauth_client, ipv6_address, and still http_server,
    api_key and http2_client.
    """
    separated = _ACRONYM_THEN_WORD.sub(r"\1_\2", name)
    separated = _WORD_THEN_CAPITAL.sub(r"\1_\2", separated)
    return "_".join(_merge_stray_letters(separated.lower().split("_")))


def _merge_stray_letters(segments: list[str]) -> list[str]:
    merged: list[str] = []
    carried = ""
    last_index = len(segments) - 1
    for index, segment in enumerate(segments):
        candidate = carried + segment
        carried = ""
        if len(candidate) == 1 and index != last_index:
            carried = candidate
            continue
        merged.append(candidate)
    return merged or [carried]
