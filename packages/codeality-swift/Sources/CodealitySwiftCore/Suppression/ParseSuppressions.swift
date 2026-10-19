/// Every suppression comment in [text]. A file-wide one without a reason is
/// not a suppression.
func parseSuppressions(_ text: String) -> [Suppression] {
  text.split(separator: "\n", omittingEmptySubsequences: false).enumerated().compactMap {
    index, line in
    if let match = line.firstMatch(of: SuppressionPatterns.fileWide) {
      return Suppression(code: String(match.code), line: nil)
    }
    if let match = line.firstMatch(of: SuppressionPatterns.inline) {
      return Suppression(code: String(match.code), line: index + 1)
    }
    return nil
  }
}
