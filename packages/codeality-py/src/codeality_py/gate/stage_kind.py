"""How much authority a gate stage has over the exit code."""

from enum import StrEnum


class StageKind(StrEnum):
    """Required stages block; optional and shadow stages never do."""

    REQUIRED = "required"
    OPTIONAL = "optional"
    SHADOW = "shadow"
