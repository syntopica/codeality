/// [text]'s lines, split on any line ending: Swift reads `\r\n` as one
/// character, so splitting on `"\n"` leaves a CRLF file whole.
func sourceLines(_ text: String) -> [Substring] {
  text.split(omittingEmptySubsequences: false, whereSeparator: \.isNewline)
}
