import Foundation
import SwiftParser
import SwiftParserDiagnostics
import SwiftSyntax

/// Parse the project-relative [path]. Recoverable syntax errors still give
/// a tree, so the other rules run on it.
public func parseSourceFile(projectRoot: String, path: String, config: SwiftConfig) throws -> SourceFile {
  let url = URL(fileURLWithPath: projectRoot).appendingPathComponent(path)
  var text = (try? String(contentsOf: url, encoding: .utf8)) ?? ""
  if text.hasPrefix("\u{FEFF}") { text.removeFirst() }
  let tree = Parser.parse(source: text)
  let converter = SourceLocationConverter(fileName: path, tree: tree)
  let parseErrors = ParseDiagnosticsGenerator.diagnostics(for: tree).map { diagnostic in
    let location = diagnostic.location(converter: converter)
    return (message: diagnostic.message, line: location.line, column: location.column)
  }
  let units = topLevelUnits(tree, converter)
  return SourceFile(
    path: path, text: text, tree: tree, converter: converter, units: units,
    role: try assignModuleRole(path: path, text: text, extensionOnly: isExtensionOnly(units), config: config),
    parseErrors: parseErrors)
}
