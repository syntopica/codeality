"""The greeting renders as a sentence."""

from greeting_service.greeting import Greeting


def test_a_greeting_renders_with_the_default_salutation() -> None:
    assert Greeting(recipient="world").rendered() == "Hello, world!"


def test_a_custom_salutation_is_used() -> None:
    assert Greeting(recipient="world", salutation="Hi").rendered() == "Hi, world!"
