/// [items] as a YAML flow sequence of single-quoted strings, the style
/// Prettier keeps.
func flowList(_ items: [String]) -> String {
    "[" + items.map { "'\($0.replacingOccurrences(of: "'", with: "''"))'" }.joined(separator: ", ") + "]"
}
