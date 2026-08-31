"""Convert a declaration name to the file name that must hold it."""

import re

from baseline_py.units.merge_stray_letters import merge_stray_letters

_ACRONYM_THEN_WORD = re.compile(r"([A-Z]+)([A-Z][a-z])")
_WORD_THEN_CAPITAL = re.compile(r"([a-z0-9])([A-Z])")


def to_snake_case(name: str) -> str:
    """Return the snake_case form of a declaration name.

    One algorithm, pinned by fixtures: HTTP2Client to http2_client,
    OAuthClient to oauth_client, IPv6Address to ipv6_address, HTTPServer to
    http_server.
    """
    separated = _ACRONYM_THEN_WORD.sub(r"\1_\2", name)
    separated = _WORD_THEN_CAPITAL.sub(r"\1_\2", separated)
    return "_".join(merge_stray_letters(separated.lower().split("_")))
