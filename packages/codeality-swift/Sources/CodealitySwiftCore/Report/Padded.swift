/// [text] padded with spaces to [width]; longer text is kept whole.
func padded(_ text: String, _ width: Int) -> String {
  text + String(repeating: " ", count: max(0, width - text.count))
}
