/// Every structural rule, in report order.
func ruleRegistry() -> [any Rule] {
  [OnePrimaryUnit(), FileMatchesUnit(), NoGrabBagNames(), MaxFileLines(), NoInlineSql()]
}
