"""The four exit codes the CLI ever returns."""

from enum import IntEnum


class ExitCode(IntEnum):
    """A skipped required tool can never produce OK."""

    OK = 0
    FINDINGS = 1
    CONFIGURATION = 2
    INFRASTRUCTURE = 3
