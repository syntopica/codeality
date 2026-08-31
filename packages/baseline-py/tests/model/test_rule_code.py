"""Rule codes carry a stable slug and never collide."""

from baseline_py.model.rule_code import RuleCode


def test_every_rule_code_has_a_slug() -> None:
    assert RuleCode.BPY001.slug == "one-primary-unit"
    assert len({code.slug for code in RuleCode}) == len(RuleCode)


def test_the_seven_v1_codes_exist() -> None:
    assert [code.value for code in RuleCode] == [f"BPY00{index}" for index in range(7)]
