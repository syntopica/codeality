"""One fixed conversion, pinned by fixtures."""

import pytest

from baseline_py.units.to_snake_case import to_snake_case

CASES = [
    ("UserRepository", "user_repository"),
    ("HTTP2Client", "http2_client"),
    ("OAuthClient", "oauth_client"),
    ("IPv6Address", "ipv6_address"),
    ("APIKey", "api_key"),
    ("Parser", "parser"),
    ("parse_source", "parse_source"),
    ("A", "a"),
    ("HTTPServer", "http_server"),
    ("SQLiteStore", "sq_lite_store"),
]


@pytest.mark.parametrize(("name", "expected"), CASES)
def test_to_snake_case(name: str, expected: str) -> None:
    assert to_snake_case(name) == expected
