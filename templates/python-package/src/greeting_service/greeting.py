"""The one unit this module exists for."""

from dataclasses import dataclass

DEFAULT_SALUTATION = "Hello"


@dataclass(frozen=True, slots=True)
class Greeting:
    """A greeting for one recipient."""

    recipient: str
    salutation: str = DEFAULT_SALUTATION

    def rendered(self) -> str:
        """Return the greeting as a sentence."""
        return f"{self.salutation}, {self.recipient}!"
