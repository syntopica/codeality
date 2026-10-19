/// All structural findings for one file, minus suppressed ones. Generated
/// and excluded files are exempt from every rule.
public func checkSourceFile(_ file: SourceFile, _ config: SwiftConfig) throws -> [Finding] {
  guard file.role != .generated, file.role != .excluded else { return [] }
  let suppressions = parseSuppressions(file.text)
  return
    ([parseErrorFinding(file)].compactMap { $0 } + ruleRegistry().flatMap { $0.check(file, config) })
    .filter { !isSuppressed($0, suppressions) }
}
