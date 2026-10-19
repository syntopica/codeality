import Foundation

/// Whether the text between SELECT and FROM names columns: a star, a comma
/// list, or a single identifier. Prose such as "an option" does not.
func isColumnList(_ columns: Substring) -> Bool {
    let stripped = columns.trimmingCharacters(in: .whitespaces)
    if stripped.isEmpty { return false }
    if stripped.contains("*") || stripped.contains(",") { return true }
    return stripped.split(whereSeparator: \.isWhitespace).count == 1
}
