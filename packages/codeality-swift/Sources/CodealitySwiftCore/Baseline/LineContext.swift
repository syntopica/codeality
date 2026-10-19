/// The whitespace-normalised source of [line] (1-based), or empty.
public func lineContext(_ text: String, _ line: Int) -> String {
  let lines = text.split(separator: "\n", omittingEmptySubsequences: false)
  guard line >= 1, line <= lines.count else { return "" }
  return lines[line - 1].split(whereSeparator: \.isWhitespace).joined(separator: " ")
}
