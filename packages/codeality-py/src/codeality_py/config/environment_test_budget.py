"""Read the per-environment override of ``test-budget-seconds``."""

from collections.abc import Mapping

from codeality_py.config.config_error import ConfigError

TEST_BUDGET_ENV_VAR = "CODEALITY_PY_TEST_BUDGET_SECONDS"


def environment_test_budget(environ: Mapping[str, str]) -> int | None:
    """Return the budget the environment sets, or None when it sets none.

    ``test-budget-seconds`` is a regression guard tuned to the machine the
    suite is developed on, and one number cannot hold for every machine: a
    suite that takes 75 s locally took 292-347 s on GitHub's 4-core runners,
    where Python 3.11 and 3.13 fall back to coverage's slow tracer
    (spectalive/qlctool, 2026-09-25). Raising the committed number would blunt
    the guard everywhere, so the environment that is slower says so for
    itself. A value that is not a positive integer is refused rather than
    ignored: a mistyped override that silently kept the committed budget, or
    a zero that silently removed it, is the failure the gate exists to catch.
    """
    raw = environ.get(TEST_BUDGET_ENV_VAR, "").strip()
    if not raw:
        return None
    try:
        seconds = int(raw)
    except ValueError as error:
        raise ConfigError(
            f"{TEST_BUDGET_ENV_VAR} must be a positive integer of seconds, found {raw!r}"
        ) from error
    if seconds <= 0:
        raise ConfigError(
            f"{TEST_BUDGET_ENV_VAR} must be a positive integer of seconds, found {raw!r}"
        )
    return seconds
