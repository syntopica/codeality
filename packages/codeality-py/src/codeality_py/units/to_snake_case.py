"""Convert a declaration name to the file name that must hold it."""

from codeality_py.units.snake_case_word import snake_case_word


def to_snake_case(name: str) -> str:
    """Return the snake_case form of a declaration name.

    One algorithm, pinned by fixtures: HTTP2Client to http2_client,
    OAuthClient to oauth_client, IPv6Address to ipv6_address, HTTPServer to
    http_server, DownloadedURLsSQL to downloaded_urls_sql. An underscore the
    name already has is kept, so is_a_step stays is_a_step.
    """
    return "_".join(snake_case_word(word) for word in name.split("_"))
