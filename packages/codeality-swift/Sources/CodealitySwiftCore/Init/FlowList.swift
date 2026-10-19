/// [items] as a YAML flow sequence of double-quoted strings.
func flowList(_ items: [String]) -> String {
    "[" + items.map { "\"\($0)\"" }.joined(separator: ", ") + "]"
}
