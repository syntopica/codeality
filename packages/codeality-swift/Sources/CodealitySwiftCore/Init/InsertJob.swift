/// [workflow] with [jobText] inserted at the end of its `jobs:` block, as
/// text, so every other line keeps its bytes and comments.
func insertJob(_ workflow: String, _ jobText: String) -> String {
  var lines = sourceLines(workflow)
  if lines.last == "" { lines.removeLast() }
  var end = jobsBlockEnd(lines)
  while end > 0 && lines[end - 1].allSatisfy(\.isWhitespace) && end < lines.count { end -= 1 }
  let before = lines[..<end].joined(separator: "\n")
  let after = lines[end...].joined(separator: "\n")
  return before + "\n" + jobText + (after.isEmpty ? "" : after + "\n")
}
