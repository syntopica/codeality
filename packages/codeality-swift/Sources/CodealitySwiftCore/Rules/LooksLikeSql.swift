/// Whether [text] is a SQL statement rather than prose about one. A SELECT
/// needs a column list that reads as one, or another clause to back it up.
func looksLikeSql(_ text: String) -> Bool {
  let normalised = text.split(whereSeparator: \.isWhitespace).joined(separator: " ").lowercased()
  if SqlPatterns.otherShapes.contains(where: { normalised.contains($0) }) { return true }
  guard let match = normalised.firstMatch(of: SqlPatterns.select),
    let columns = match["columns"]?.substring
  else { return false }
  return normalised.contains(SqlPatterns.clauses) || isColumnList(columns)
}
