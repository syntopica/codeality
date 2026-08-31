"""Raised when the checker itself cannot do its job."""


class InfrastructureError(Exception):
    """An unreadable file or an unusable runtime. The CLI maps this to exit 3."""
