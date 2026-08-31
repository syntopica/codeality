"""Raised for any invalid or unsupported configuration."""


class ConfigError(Exception):
    """A configuration problem. The CLI maps this to exit code 2."""
