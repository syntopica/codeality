import SwiftSyntax

/// One parsed `.swift` file and everything the rules read from it.
public struct SourceFile {
  public let path: String
  public let text: String
  public let tree: SourceFileSyntax
  public let converter: SourceLocationConverter
  public let units: [Unit]
  public let role: ModuleRole
  /// The parser's diagnostics: message and 1-based line and column.
  public let parseErrors: [(message: String, line: Int, column: Int)]
}
