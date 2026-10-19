/// A structural rule over one parsed file.
public protocol Rule {
  var code: RuleCode { get }
  func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding]
}
